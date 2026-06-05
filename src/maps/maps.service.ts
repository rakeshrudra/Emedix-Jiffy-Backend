import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface GeocodeResult {
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  error_message?: string;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private readonly geocodingUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(private readonly configService: ConfigService) { }

  /**
   * Reverse geocoding: lat/lng → structured address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    try {
      const response = await axios.get<GoogleGeocodeResponse>(
        this.geocodingUrl,
        {
          params: { latlng: `${latitude},${longitude}`, key: apiKey },
          timeout: 8000,
        },
      );

      this.assertGoogleStatus(response.data, 'reverse');
      return this.extractGeoFields(response.data, latitude, longitude);
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.handleAxiosError(err as AxiosError, 'reverse geocoding');
    }
  }

  /**
   * Forward geocoding: address string → lat/lng + formatted address
   */
  async forwardGeocode(addressString: string): Promise<GeocodeResult> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    try {
      const response = await axios.get<GoogleGeocodeResponse>(
        this.geocodingUrl,
        {
          params: { address: addressString, key: apiKey },
          timeout: 8000,
        },
      );

      this.assertGoogleStatus(response.data, 'forward');
      const { lat, lng } = response.data.results[0].geometry.location;
      return this.extractGeoFields(response.data, lat, lng);
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.handleAxiosError(err as AxiosError, 'forward geocoding');
    }
  }

  private assertGoogleStatus(data: GoogleGeocodeResponse, direction: 'reverse' | 'forward'): void {
    if (data.status === 'ZERO_RESULTS') {
      throw new InternalServerErrorException(direction === 'reverse' ? 'Unable to resolve address from location' : 'Address not found. Please check the address and try again.');
    }
    if (data.status !== 'OK') {
      this.logger.error(`Google Maps API error [${data.status}]: ${data.error_message ?? ''}`);
      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new InternalServerErrorException('Maps service quota exceeded. Please try again later.');
      }
      throw new InternalServerErrorException('Unable to resolve address from location');
    }
  }

  private extractGeoFields(data: GoogleGeocodeResponse, latitude: number, longitude: number): GeocodeResult {
    const result = data.results[0];
    const components = result.address_components;

    const get = (...types: string[]): string => {
      const comp = components.find((c) => types.every((t) => c.types.includes(t)));
      return comp ? comp.long_name : '';
    };

    const city = get('locality') || get('administrative_area_level_2') || get('sublocality_level_1') || '';

    const state = get('administrative_area_level_1');
    const country = get('country');
    const pincode = get('postal_code');

    return {
      formattedAddress: result.formatted_address,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude,
    };
  }

  private handleAxiosError(err: AxiosError, context: string): never {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        this.logger.error(`${context} timeout: ${err.message}`);
        throw new InternalServerErrorException('Maps service timed out. Please try again.');
      }
      this.logger.error(`${context} network error: ${err.message}`);
    } else {
      this.logger.error(`${context} unexpected error: ${String(err)}`);
    }
    throw new InternalServerErrorException('Unable to resolve address from location');
  }
}
