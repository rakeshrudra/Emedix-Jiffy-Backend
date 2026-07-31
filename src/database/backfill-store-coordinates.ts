import 'reflect-metadata';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { AppDataSource } from './data-source';
import { Store } from '../stores/entities/store.entity';

dotenv.config();

const IS_DRY_RUN = process.argv.includes('--dry-run');
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const REQUEST_DELAY_MS = 200; // stay well under Google's rate limits

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
  error_message?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(query: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const response = await axios.get<GoogleGeocodeResponse>(GEOCODE_URL, {
    params: { address: query, key: apiKey },
    timeout: 8000,
  });

  if (response.data.status === 'ZERO_RESULTS') return null;

  if (response.data.status !== 'OK') {
    throw new Error(
      `Geocoding error [${response.data.status}] for "${query}": ${response.data.error_message ?? 'unknown'}`,
    );
  }

  const { lat, lng } = response.data.results[0].geometry.location;
  return { lat, lng };
}

async function backfillStoreCoordinates() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set in .env');
  }

  await AppDataSource.initialize();

  const storeRepository = AppDataSource.getRepository(Store);
  const stores = await storeRepository
    .createQueryBuilder('store')
    .where('store.latitude = 0 AND store.longitude = 0')
    .getMany();

  console.log(`Found ${stores.length} store(s) with missing coordinates.`);

  let updated = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const store of stores) {
    if (!store.emedix_name?.trim()) {
      skipped += 1;
      console.warn(`Store ${store.store_id} has no emedix_name — skipped.`);
      continue;
    }

    try {
      const coords = await geocode(store.emedix_name, apiKey);

      if (!coords) {
        skipped += 1;
        console.warn(`No geocode result for "${store.emedix_name}" (store_id ${store.store_id}) — skipped.`);
        continue;
      }

      console.log(
        `${store.emedix_name} (${store.store_id}): ${coords.lat}, ${coords.lng}${IS_DRY_RUN ? ' [dry-run]' : ''}`,
      );

      if (!IS_DRY_RUN) {
        store.latitude = coords.lat;
        store.longitude = coords.lng;
        await storeRepository.save(store);
      }

      updated += 1;
    } catch (error) {
      failures.push(store.emedix_name);
      console.error(`Failed to geocode "${store.emedix_name}" (store_id ${store.store_id}):`, error);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  await AppDataSource.destroy();

  console.log(
    `\nDone. ${updated} updated, ${skipped} skipped (no result), ${failures.length} failed.${IS_DRY_RUN ? ' (dry-run — no rows were saved)' : ''}`,
  );
  if (failures.length) {
    console.log('Failed stores:', failures.join(', '));
  }
}

backfillStoreCoordinates().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
