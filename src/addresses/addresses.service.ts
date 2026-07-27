import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { SaveAddressDto } from './dto/save-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const MAX_ADDRESSES_PER_USER = 5;

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  /**
   * POST /api/address
   * Saves a confirmed address (GPS, manual, or Places Autocomplete).
   * Frontend resolves all fields before calling this.
   * Enforces max 5 addresses per user.
   * First address is automatically set as default.
   */
  async saveAddress(user_id: string, dto: SaveAddressDto) {
    if (!user_id) {
      throw new BadRequestException('Missing user_id');
    }

    const existingCount = await this.addressRepository.count({ where: { user_id: user_id } });

    if (existingCount >= MAX_ADDRESSES_PER_USER) {
      throw new BadRequestException(
        `You can save up to ${MAX_ADDRESSES_PER_USER} addresses. Please delete one before adding a new one.`,
      );
    }

    // Prevent near-duplicate: same lat/lng already saved for this user
    const duplicate = await this.addressRepository.findOne({
      where: { user_id: user_id, latitude: dto.latitude, longitude: dto.longitude },
    });
    if (duplicate) {
      return { success: true, message: 'Address already saved', data: this.format(duplicate) };
    }

    const isDefault = existingCount === 0 ? true : (dto.is_default ?? false);

    if (isDefault) {
      await this.clearDefault(user_id);
    }

    const address = this.addressRepository.create({
      user_id: user_id,
      label: dto.label ?? 'Other',
      address_line_1: dto.address_line_1,
      address_line_2: dto.address_line_2 ?? '',
      formatted_address: dto.formatted_address,
      place_id: dto.place_id ?? null,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      country: dto.country ?? 'India',
      latitude: dto.latitude,
      longitude: dto.longitude,
      source: dto.source ?? 'manual',
      is_default: isDefault,
    });

    const saved = await this.addressRepository.save(address);
    this.logger.log(`Address saved for user ${user_id}: ${saved.formatted_address}`);

    return { success: true, data: this.format(saved) };
  }

  /**
   * GET /api/address
   * List all saved addresses for the user. Default is returned first.
   */
  async getUserAddresses(user_id: string) {
    const addresses = await this.addressRepository.find({
      where: { user_id: user_id },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
    return { success: true, data: addresses.map((a) => this.format(a)) };
  }

  /**
   * PATCH /api/address/:id
   * Update label or set as default. Ownership enforced.
   */
  async updateAddress(user_id: string, address_id: string, dto: UpdateAddressDto) {
    const address = await this.findOwned(user_id, address_id);

    if (dto.label !== undefined) address.label = dto.label;

    if (dto.is_default === true && !address.is_default) {
      await this.clearDefault(user_id, address_id);
      address.is_default = true;
    }

    const updated = await this.addressRepository.save(address);
    return { success: true, data: this.format(updated) };
  }

  /**
   * DELETE /api/address/:id
   * Deletes an address. If deleted address was default, promotes the next most recent.
   */
  async removeAddress(user_id: string, address_id: string) {
    const address = await this.findOwned(user_id, address_id);
    const wasDefault = address.is_default;

    await this.addressRepository.remove(address);

    if (wasDefault) {
      const next = await this.addressRepository.findOne({
        where: { user_id: user_id },
        order: { created_at: 'DESC' },
      });
      if (next) {
        await this.addressRepository.update(next.id, { is_default: true });
      }
    }

    return { success: true, message: 'Address removed successfully' };
  }

  /**
   * Fetches a single address owned by the user, as a raw entity.
   * Used by other services (e.g. OrdersService) that need the actual
   * record — not the HTTP `{ success, data }` envelope.
   */
  async findOwnedAddress(user_id: string, address_id: string): Promise<Address> {
    return this.findOwned(user_id, address_id);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findOwned(user_id: string, address_id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: address_id, user_id: user_id },
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  private async clearDefault(user_id: string, exclude_id?: string): Promise<void> {
    const where: any = { user_id: user_id, is_default: true };
    if (exclude_id) where.id = Not(exclude_id);
    await this.addressRepository.update(where, { is_default: false });
  }

  private format(a: Address) {
    return {
      id: a.id,
      label: a.label,
      address_line_1: a.address_line_1,
      address_line_2: a.address_line_2,
      formatted_address: a.formatted_address,
      place_id: a.place_id ?? null,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      latitude: Number(a.latitude),
      longitude: Number(a.longitude),
      source: a.source,
      is_default: a.is_default,
      created_at: a.created_at,
      updated_at: a.updated_at,
    };
  }
}
