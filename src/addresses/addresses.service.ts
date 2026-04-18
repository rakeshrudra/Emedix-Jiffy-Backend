import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { MapsService } from '../maps/maps.service';
import { GetLocationDto } from './dto/get-location.dto';
import { AddAddressDto } from './dto/add-address.dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly mapsService: MapsService,
  ) { }

  /**
   * Get User Current Location (Reverse Geocoding)
   * POST /api/address/get-location
   */
  async getLocation(userId: string, geoLocationDto: GetLocationDto) {
    const { latitude, longitude, label } = geoLocationDto;

    // Validate coordinate ranges (double-check beyond class-validator)
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }

    // Call Google Maps Reverse Geocoding
    const geo = await this.mapsService.reverseGeocode(latitude, longitude);

    // Persist to DB
    const address = this.addressRepository.create({
      userId,
      label: label ?? null,
      addressLine1: geo.formattedAddress,
      formattedAddress: geo.formattedAddress,
      city: geo.city,
      state: geo.state,
      country: geo.country,
      pincode: geo.pincode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      source: 'gps',
    });

    await this.addressRepository.save(address);
    this.logger.log(`GPS address saved for user ${userId}: ${geo.formattedAddress}`);

    return {
      success: true,
      data: {
        id: address.id,
        formatted_address: geo.formattedAddress,
        city: geo.city,
        state: geo.state,
        pincode: geo.pincode,
        country: geo.country,
        latitude: geo.latitude,
        longitude: geo.longitude,
        source: 'gps',
      },
    };
  }

  /**
   * Add Address Manually (Forward Geocoding)
   * POST /api/address/add
   */
  async addAddress(userId: string, addAddressDto: AddAddressDto) {
    const { address_line, city, state, pincode, country, label, address_line_2 } = addAddressDto;

    // Build full query string for Google Maps
    const fullAddress = [address_line, city, state, pincode, country ?? 'India']
      .filter(Boolean)
      .join(', ');

    // Call Google Maps Forward Geocoding
    const geo = await this.mapsService.forwardGeocode(fullAddress);

    // Business Logic: Check for Duplicate Addresses (same user, roughly same location)
    const existingAddress = await this.addressRepository.findOne({
      where: {
        userId,
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    });

    if (existingAddress) {
      this.logger.log(`Duplicate address detected for user ${userId}: ${geo.formattedAddress}`);
      return {
        success: true,
        message: 'Address already exists in your profile',
        data: existingAddress,
      };
    }

    // Persist to DB
    const address = this.addressRepository.create({
      userId,
      label: label ?? null,
      addressLine1: address_line,
      addressLine2: address_line_2 ?? null,
      formattedAddress: geo.formattedAddress,
      city: geo.city || city,
      state: geo.state || state,
      country: geo.country || country || 'India',
      pincode: geo.pincode || pincode,
      latitude: geo.latitude,
      longitude: geo.longitude,
      source: 'manual',
    });

    await this.addressRepository.save(address);
    this.logger.log(`Manual address saved for user ${userId}: ${geo.formattedAddress}`);

    return {
      success: true,
      data: {
        id: address.id,
        formatted_address: geo.formattedAddress,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        latitude: geo.latitude,
        longitude: geo.longitude,
        source: 'manual',
      }
    };
  }

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete an address (must belong to the requesting user)
   */
  async removeAddress(userId: string, addressId: string) {
    const address = await this.addressRepository.findOne({ where: { id: addressId, userId } });

    if (!address) {
      throw new BadRequestException('Address not found or does not belong to user');
    }

    await this.addressRepository.remove(address);
    return { success: true, message: 'Address removed successfully' };
  }
}
