import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface GeocodeResult {
  formatted_address: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface PlaceAutocompleteResult {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetailsResult extends GeocodeResult {
  place_id: string;
}

interface GooglePlacesAutocompleteResponse {
  status: string;
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }>;
  error_message?: string;
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

interface GooglePlaceDetailsResponse {
  status: string;
  result?: {
    name: string;
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  };
  error_message?: string;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  private readonly geocodingUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly autocompleteUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
  private readonly placeDetailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';

  constructor(private readonly configService: ConfigService) { }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    this.assertValidCoordinates(latitude, longitude);

    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    try {
      const response = await axios.get<GoogleGeocodeResponse>(this.geocodingUrl, {
        params: { latlng: `${latitude},${longitude}`, key: apiKey },
        timeout: 8000,
      });
      this.assertGeocodeStatus(response.data, 'Unable to resolve address from coordinates');
      return this.extractGeoFields(response.data, latitude, longitude);
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.handleAxiosError(err as AxiosError, 'reverse geocoding');
    }
  }

  async forwardGeocode(addressString: string): Promise<GeocodeResult> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    try {
      const response = await axios.get<GoogleGeocodeResponse>(this.geocodingUrl, {
        params: { address: addressString, key: apiKey },
        timeout: 8000,
      });
      this.assertGeocodeStatus(response.data, 'Address not found. Please check and try again.');
      const { lat, lng } = response.data.results[0].geometry.location;
      return this.extractGeoFields(response.data, lat, lng);
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.handleAxiosError(err as AxiosError, 'forward geocoding');
    }
  }

  async autocomplete(input: string): Promise<PlaceAutocompleteResult[]> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    try {
      const response = await axios.get<GooglePlacesAutocompleteResponse>(this.autocompleteUrl, {
        params: { input, key: apiKey, components: 'country:in' },
        timeout: 8000,
      });
      this.assertPlacesStatus(response.data);
      return response.data.predictions.map((p) => ({
        description: p.description,
        place_id: p.place_id,
        main_text: p.structured_formatting?.main_text ?? '',
        secondary_text: p.structured_formatting?.secondary_text ?? '',
      }));
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.handleAxiosError(err as AxiosError, 'places autocomplete');
    }
  }

  async placeDetails(placeId: string): Promise<PlaceDetailsResult> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    try {
      const response = await axios.get<GooglePlaceDetailsResponse>(this.placeDetailsUrl, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,address_components',
          key: apiKey,
        },
        timeout: 8000,
      });

      if (response.data.status !== 'OK' || !response.data.result) {
        this.logger.error(`Place Details error [${response.data.status}]: ${response.data.error_message ?? ''}`);
        throw new InternalServerErrorException('Could not retrieve place details. Please try again.');
      }

      const result = response.data.result;
      const components = result.address_components;
      const { lat, lng } = result.geometry.location;

      const get = (...types: string[]): string => {
        const c = components.find((comp) => types.every((t) => comp.types.includes(t)));
        return c ? c.long_name : '';
      };

      const city =
        get('locality') ||
        get('administrative_area_level_2') ||
        get('sublocality_level_1') ||
        '';

      return {
        place_id: placeId,
        formatted_address: result.formatted_address,
        address_line_2: result.name,
        city,
        state: get('administrative_area_level_1'),
        country: get('country') || 'India',
        pincode: get('postal_code'),
        latitude: lat,
        longitude: lng,
      };
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.handleAxiosError(err as AxiosError, 'place details');
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private assertValidCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Invalid coordinates');
    }
  }

  private extractGeoFields(
    data: GoogleGeocodeResponse,
    latitude: number,
    longitude: number,
  ): GeocodeResult {
    const result = data.results[0];
    const components = result.address_components;

    const get = (...types: string[]): string => {
      const c = components.find((comp) => types.every((t) => comp.types.includes(t)));
      return c ? c.long_name : '';
    };

    const city =
      get('locality') ||
      get('administrative_area_level_2') ||
      get('sublocality_level_1') ||
      '';

    const address_line_2 =
      get('sublocality_level_1') ||
      get('sublocality') ||
      get('neighborhood') ||
      get('route') ||
      '';

    return {
      formatted_address: result.formatted_address,
      address_line_2,
      city,
      state: get('administrative_area_level_1'),
      country: get('country') || 'India',
      pincode: get('postal_code'),
      latitude,
      longitude,
    };
  }

  private assertGeocodeStatus(data: GoogleGeocodeResponse, zeroResultsMessage: string): void {
    if (data.status === 'ZERO_RESULTS') {
      throw new InternalServerErrorException(zeroResultsMessage);
    }
    if (data.status !== 'OK') {
      this.logger.error(`Google Maps Geocoding error [${data.status}]: ${data.error_message ?? ''}`);
      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new InternalServerErrorException('Maps service quota exceeded. Please try again later.');
      }
      throw new InternalServerErrorException('Maps service error. Please try again.');
    }
  }

  private assertPlacesStatus(data: GooglePlacesAutocompleteResponse): void {
    if (data.status === 'ZERO_RESULTS') return;
    if (data.status !== 'OK') {
      this.logger.error(`Google Places error [${data.status}]: ${data.error_message ?? ''}`);
      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new InternalServerErrorException('Places service quota exceeded. Please try again later.');
      }
      if (data.status === 'REQUEST_DENIED') {
        throw new InternalServerErrorException('Places API request denied. Check API key configuration.');
      }
      throw new InternalServerErrorException('Unable to fetch place suggestions.');
    }
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
    throw new InternalServerErrorException('Maps service unavailable. Please try again.');
  }
}
