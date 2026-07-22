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
  ) {}

  /**
   * POST /api/stores
   * Adds a new store. store_id must be unique.
   */
  async create(dto: CreateStoreDto) {
    const existing = await this.storeRepository.findOne({
      where: { storeId: dto.store_id },
    });
    if (existing) {
      throw new ConflictException(
        `Store with ERP code '${dto.store_id}' already exists.`,
      );
    }

    const store = this.storeRepository.create({
      storeId: dto.store_id,
      name: dto.name,
      addressLine1: dto.address_line_1,
      formattedAddress: dto.formatted_address,
      placeId: dto.place_id ?? null,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      country: dto.country ?? 'India',
      latitude: dto.latitude,
      longitude: dto.longitude,
      deliveryRadiusKm: dto.delivery_radius_km ?? 5.0,
      phone: dto.phone ?? null,
      openingTime: dto.opening_time ?? null,
      closingTime: dto.closing_time ?? null,
      isActive: dto.is_active ?? true,
    });

    const saved = await this.storeRepository.save(store);
    this.logger.log(`Store created: ${saved.name} (${saved.storeId})`);

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

  async findStoreForAdminByStoreId(storeId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { storeId },
    });

    if (!store || !store.isActive) {
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
  async assertOrderable(storeId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { storeId } });

    if (!store || !store.isActive) {
      throw new BadRequestException('This store is currently unavailable. Please try again later.');
    }

    if (!this.isStoreOpen(store)) {
      throw new BadRequestException(`Store is closed. It opens at ${store.openingTime}.`);
    }

    return store;
  }

  async assertOrderableAt(
    storeId: string,
    scheduledDate: string,
    scheduleStart: string,
    scheduleEnd: string,
  ): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { storeId } });

    if (!store || !store.isActive) {
      throw new BadRequestException('This store is currently unavailable. Please try again later.');
    }

    const scheduledAt = this.parseIstDateTime(scheduledDate, scheduleStart);
    const now = new Date();
    const minScheduledAt = new Date(now.getTime() + 60 * 60 * 1000);
    const maxScheduledAt = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const startMinutes = this.timeToMinutes(scheduleStart);
    const endMinutes = this.timeToMinutes(scheduleEnd);

    if (scheduledAt.getTime() < minScheduledAt.getTime()) {
      throw new BadRequestException('Scheduled order time must be at least 1 hour from now.');
    }

    if (scheduledAt.getTime() > maxScheduledAt.getTime()) {
      throw new BadRequestException('Scheduled order time cannot be more than 4 days from now.');
    }

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('schedule_end must be after schedule_start.');
    }

    if (!this.isSlotWithinStoreHours(scheduleStart, scheduleEnd, store.openingTime, store.closingTime)) {
      throw new BadRequestException(
        `Selected slot must be between ${store.openingTime} and ${store.closingTime}.`,
      );
    }

    return store;
  }

  isStoreOpen(store: Store): boolean {
    return this.isStoreOpenAt(store.openingTime, store.closingTime);
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
        id, store_id, name, address_line_1, formatted_address, place_id,
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
      name: r.name,
      address_line_1: r.address_line_1,
      formatted_address: r.formatted_address,
      place_id: r.place_id ?? null,
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
  private isStoreOpenAt(openingTime: string | null, closingTime: string | null): boolean {
    if (!openingTime || !closingTime) return true;

    const now = new Date();
    // Convert UTC to IST (UTC+5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);

    const [oh, om] = openingTime.split(':').map(Number);
    const [ch, cm] = closingTime.split(':').map(Number);

    const currentMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;

    if (closeMinutes > openMinutes) {
      // Normal day (e.g. 09:00 – 22:00)
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }
    // Overnight (e.g. 22:00 – 02:00) — unlikely for pharmacies but handled
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

  private isTimeWithinStoreHours(
    time: string,
    openingTime: string | null,
    closingTime: string | null,
  ): boolean {
    if (!openingTime || !closingTime) return true;

    const selectedMinutes = this.timeToMinutes(time);
    const openMinutes = this.timeToMinutes(openingTime);
    const closeMinutes = this.timeToMinutes(closingTime);

    if (closeMinutes > openMinutes) {
      return selectedMinutes >= openMinutes && selectedMinutes < closeMinutes;
    }

    return selectedMinutes >= openMinutes || selectedMinutes < closeMinutes;
  }

  private isSlotWithinStoreHours(
    startTime: string,
    endTime: string,
    openingTime: string | null,
    closingTime: string | null,
  ): boolean {
    if (!openingTime || !closingTime) return true;

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const openMinutes = this.timeToMinutes(openingTime);
    const closeMinutes = this.timeToMinutes(closingTime);

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
      store_id: s.storeId,
      name: s.name,
      address_line_1: s.addressLine1,
      formatted_address: s.formattedAddress,
      place_id: s.placeId ?? null,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      country: s.country,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      delivery_radius_km: Number(s.deliveryRadiusKm),
      phone: s.phone ?? null,
      opening_time: s.openingTime ?? null,
      closing_time: s.closingTime ?? null,
      is_active: s.isActive,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    };
  }
}
