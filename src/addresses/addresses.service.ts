import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { MapsService } from '../maps/maps.service';
import { GeocodeDto } from './dto/geocode.dto';
import { SaveAddressDto } from './dto/save-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const MAX_ADDRESSES_PER_USER = 5;

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly mapsService: MapsService,
  ) {}

  /**
   * Forward-geocode a free-text query and return a preview.
   * Does NOT save to DB — user must confirm and call saveAddress.
   */
  async geocodeQuery(dto: GeocodeDto) {
    const geo = await this.mapsService.forwardGeocode(dto.query);
    return {
      success: true,
      data: {
        formatted_address: geo.formattedAddress,
        city: geo.city,
        state: geo.state,
        pincode: geo.pincode,
        country: geo.country,
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    };
  }

  /**
   * Save a confirmed address (GPS or manual).
   * Frontend has already resolved coordinates before calling this.
   * Enforces max 5 addresses per user.
   * First address saved is automatically set as default.
   */
  async saveAddress(userId: string, dto: SaveAddressDto) {
    const existingCount = await this.addressRepository.count({ where: { userId } });

    if (existingCount >= MAX_ADDRESSES_PER_USER) {
      throw new BadRequestException(
        `You can save up to ${MAX_ADDRESSES_PER_USER} addresses. Please delete one before adding a new one.`,
      );
    }

    // Prevent near-duplicate: same lat/lng already saved for this user
    const duplicate = await this.addressRepository.findOne({
      where: { userId, latitude: dto.latitude, longitude: dto.longitude },
    });
    if (duplicate) {
      return { success: true, message: 'Address already saved', data: this.format(duplicate) };
    }

    // First address for this user is always default
    const isDefault = existingCount === 0 ? true : (dto.is_default ?? false);

    // If this one is being set as default, clear existing default first
    if (isDefault) {
      await this.clearDefault(userId);
    }

    const address = this.addressRepository.create({
      userId,
      label: dto.label ?? null,
      addressLine1: dto.address_line_1,
      addressLine2: dto.address_line_2 ?? null,
      formattedAddress: dto.formatted_address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      country: dto.country ?? 'India',
      latitude: dto.latitude,
      longitude: dto.longitude,
      source: dto.source ?? 'manual',
      isDefault,
    });

    const saved = await this.addressRepository.save(address);
    this.logger.log(`Address saved for user ${userId}: ${saved.formattedAddress}`);

    return { success: true, data: this.format(saved) };
  }

  /**
   * List all saved addresses for the authenticated user.
   * Default address is always returned first.
   */
  async getUserAddresses(userId: string) {
    const addresses = await this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return { success: true, data: addresses.map(this.format) };
  }

  /**
   * Update label or set as default.
   * Ownership is enforced — address must belong to the requesting user.
   */
  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.findOwned(userId, addressId);

    if (dto.label !== undefined) address.label = dto.label;

    if (dto.is_default === true && !address.isDefault) {
      await this.clearDefault(userId, addressId);
      address.isDefault = true;
    }

    const updated = await this.addressRepository.save(address);
    return { success: true, data: this.format(updated) };
  }

  /**
   * Delete an address.
   * If the deleted address was default, promote the most recent remaining one.
   */
  async removeAddress(userId: string, addressId: string) {
    const address = await this.findOwned(userId, addressId);
    const wasDefault = address.isDefault;

    await this.addressRepository.remove(address);

    if (wasDefault) {
      const next = await this.addressRepository.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (next) {
        await this.addressRepository.update(next.id, { isDefault: true });
      }
    }

    return { success: true, message: 'Address removed successfully' };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findOwned(userId: string, addressId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  private async clearDefault(userId: string, excludeId?: string): Promise<void> {
    const where: any = { userId, isDefault: true };
    if (excludeId) where.id = Not(excludeId);
    await this.addressRepository.update(where, { isDefault: false });
  }

  private format(a: Address) {
    return {
      id: a.id,
      label: a.label,
      address_line_1: a.addressLine1,
      address_line_2: a.addressLine2,
      formatted_address: a.formattedAddress,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
      source: a.source,
      is_default: a.isDefault,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    };
  }
}
