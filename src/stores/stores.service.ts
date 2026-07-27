import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';

export interface StoreWithDistance extends ReturnType<StoresService['format']> {
  distance_km: number;
  is_open: boolean;
}

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) { }

  /**
   * POST /api/stores
   * Adds a new store. store_id must be unique.
   */
  async create(dto: CreateStoreDto) {
    const existing = await this.storeRepository.findOne({
      where: { store_id: dto.store_id },
    });
    if (existing) {
      throw new ConflictException(
        `Store with ERP code '${dto.store_id}' already exists.`,
      );
    }

    const store = this.storeRepository.create({
      store_id: dto.store_id,
      emedix_name: dto.emedix_name,
      name: dto.name,
      address_line_1: dto.address_line_1,
      formatted_address: dto.formatted_address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      country: dto.country ?? 'India',
      latitude: dto.latitude,
      longitude: dto.longitude,
      delivery_radius_km: dto.delivery_radius_km ?? 5.0,
      phone: dto.phone ?? null,
      opening_time: dto.opening_time ?? null,
      closing_time: dto.closing_time ?? null,
      is_active: dto.is_active ?? true,
    });

    const saved = await this.storeRepository.save(store);
    this.logger.log(`Store created: ${saved.name} (${saved.store_id})`);

    return { success: true, data: this.format(saved) };
  }

  /**
   * GET /api/stores/nearest?lat=&lng=
   * Returns the single nearest active store whose delivery radius covers the user's location.
   * Uses the Haversine formula via a raw query for accurate distance.
   */
  async findNearest(lat: number, lng: number) {
    this.assertValidCoordinates(lat, lng);
    const results = await this.haversineQuery(lat, lng, 1);

    if (results.length === 0) {
      return {
        success: false,
        message: 'No pharmacy available in your area. We are expanding soon!',
        data: null,
      };
    }

    const store = results[0];
    return {
      success: true,
      data: {
        ...store,
        is_open: this.isStoreOpenAt(store.opening_time, store.closing_time),
      },
    };
  }

  /**
   * GET /api/stores/reachable?lat=&lng=
   * Returns all active stores whose delivery radius covers the user's location.
   * Ordered by distance (closest first).
   */
  async findReachable(lat: number, lng: number) {
    this.assertValidCoordinates(lat, lng);
    const results = await this.haversineQuery(lat, lng);

    return {
      success: true,
      data: results.map((s) => ({
        ...s,
        is_open: this.isStoreOpenAt(s.opening_time, s.closing_time),
      })),
    };
  }

  /**
   * GET /api/stores/:id
   * Returns a single store by UUID.
   */
  async findOne(id: string) {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');

    return {
      success: true,
      data: {
        ...this.format(store),
        is_open: this.isStoreOpen(store),
      },
    };
  }

  async findStoreForAdminByStoreId(store_id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { store_id: store_id },
    });

    if (!store || !store.is_active) {
      throw new BadRequestException('Store is invalid or inactive');
    }

    return store;
  }

  /**
   * Looks up a store by its ERP store_id and asserts it can currently accept
   * orders (exists, active, within opening hours). Throws BadRequestException
   * with a user-facing message otherwise. Single source of truth for this
   * check — callers (e.g. OrdersService) should not re-derive it themselves.
   */
  async assertOrderable(store_id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { store_id: store_id } });

    if (!store || !store.is_active) {
      throw new BadRequestException('This store is currently unavailable. Please try again later.');
    }

    if (!this.isStoreOpen(store)) {
      throw new BadRequestException(`Store is closed. It opens at ${store.opening_time}.`);
    }

    return store;
  }

  async assertOrderableAt(
    store_id: string,
    scheduled_date: string,
    schedule_start: string,
    schedule_end: string,
  ): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { store_id: store_id } });

    if (!store || !store.is_active) {
      throw new BadRequestException('This store is currently unavailable. Please try again later.');
    }

    const scheduledAt = this.parseIstDateTime(scheduled_date, schedule_start);
    const now = new Date();
    const minScheduledAt = new Date(now.getTime() + 60 * 60 * 1000);
    const maxScheduledAt = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const startMinutes = this.timeToMinutes(schedule_start);
    const endMinutes = this.timeToMinutes(schedule_end);

    if (scheduledAt.getTime() < minScheduledAt.getTime()) {
      throw new BadRequestException('Scheduled order time must be at least 1 hour from now.');
    }

    if (scheduledAt.getTime() > maxScheduledAt.getTime()) {
      throw new BadRequestException('Scheduled order time cannot be more than 4 days from now.');
    }

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('schedule_end must be after schedule_start.');
    }

    if (!this.isSlotWithinStoreHours(schedule_start, schedule_end, store.opening_time, store.closing_time)) {
      throw new BadRequestException(
        `Selected slot must be between ${store.opening_time} and ${store.closing_time}.`,
      );
    }

    return store;
  }

  isStoreOpen(store: Store): boolean {
    return this.isStoreOpenAt(store.opening_time, store.closing_time);
  }

  assertValidCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Invalid coordinates');
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Haversine distance query.
   * Filters active stores whose delivery_radius_km covers the given lat/lng.
   * Returns at most `limit` results ordered by distance asc.
   */
  private async haversineQuery(lat: number, lng: number, limit?: number) {
    const limitClause = limit ? `LIMIT ${limit}` : '';

    const rows: any[] = await this.storeRepository.query(
      `
      SELECT
        id, store_id, emedix_name, name, address_line_1, formatted_address,
        city, state, pincode, country,
        latitude, longitude, delivery_radius_km, phone,
        opening_time, closing_time, is_active,
        (
          6371 * ACOS(
            LEAST(1.0, COS(RADIANS(?)) * COS(RADIANS(latitude))
              * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?)) * SIN(RADIANS(latitude)))
          )
        ) AS distance_km
      FROM stores
      WHERE is_active = 1
      HAVING distance_km <= delivery_radius_km
      ORDER BY distance_km ASC
      ${limitClause}
      `,
      [lat, lng, lat],
    );

    return rows.map((r) => ({
      id: r.id,
      store_id: r.store_id,
      emedix_name: r.emedix_name,
      name: r.name,
      address_line_1: r.address_line_1,
      formatted_address: r.formatted_address,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      country: r.country,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      delivery_radius_km: Number(r.delivery_radius_km),
      distance_km: Math.round(Number(r.distance_km) * 100) / 100,
      phone: r.phone ?? null,
      opening_time: r.opening_time ?? null,
      closing_time: r.closing_time ?? null,
      is_active: Boolean(r.is_active),
    }));
  }

  /**
   * Determines if the store is currently open based on IST (UTC+5:30).
   * Returns true if opening_time and closing_time are not set (assumed always open).
   */
  private isStoreOpenAt(opening_time: string | null, closing_time: string | null): boolean {
    if (!opening_time || !closing_time) return true;

    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);

    const [oh, om] = opening_time.split(':').map(Number);
    const [ch, cm] = closing_time.split(':').map(Number);

    const currentMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;

    if (closeMinutes > openMinutes) {
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  private parseIstDateTime(date: string, time: string): Date {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(time);

    if (!dateMatch || !timeMatch) {
      throw new BadRequestException('Scheduled date/time format is invalid.');
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const second = Number(timeMatch[3]);
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const scheduledAt = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second) - istOffsetMs,
    );
    const normalizedIst = new Date(scheduledAt.getTime() + istOffsetMs);

    if (
      normalizedIst.getUTCFullYear() !== year ||
      normalizedIst.getUTCMonth() !== month - 1 ||
      normalizedIst.getUTCDate() !== day
    ) {
      throw new BadRequestException('scheduled_date must be a real calendar date.');
    }

    return scheduledAt;
  }

  private isSlotWithinStoreHours(
    start_time: string,
    end_time: string,
    opening_time: string | null,
    closing_time: string | null,
  ): boolean {
    if (!opening_time || !closing_time) return true;

    const startMinutes = this.timeToMinutes(start_time);
    const endMinutes = this.timeToMinutes(end_time);
    const openMinutes = this.timeToMinutes(opening_time);
    const closeMinutes = this.timeToMinutes(closing_time);

    if (closeMinutes > openMinutes) {
      return startMinutes >= openMinutes && endMinutes <= closeMinutes;
    }

    return startMinutes >= openMinutes || endMinutes <= closeMinutes;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private format(s: Store) {
    return {
      id: s.id,
      store_id: s.store_id,
      emedix_name: s.emedix_name,
      name: s.name,
      address_line_1: s.address_line_1,
      formatted_address: s.formatted_address,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      country: s.country,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      delivery_radius_km: Number(s.delivery_radius_km),
      phone: s.phone ?? null,
      opening_time: s.opening_time ?? null,
      closing_time: s.closing_time ?? null,
      is_active: s.is_active,
    };
  }
}
