import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from './data-source';
import { Store } from '../stores/entities/store.entity';

type CsvStoreRow = {
  erpStoreCode: string;
  name: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  isActive: boolean;
  hadMissingCoordinates: boolean;
};

const DEFAULT_COORDINATE = 0;
const DEFAULT_DELIVERY_RADIUS_KM = 5.0;
const CSV_PATH = path.resolve(process.cwd(), 'Storeimport.csv');
const IS_DRY_RUN = process.argv.includes('--dry-run');

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field.trim());
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);

  return rows;
}

function toNumber(value: string): number | null {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: string): boolean {
  return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase());
}

function extractPincode(address: string): string {
  return address.match(/\b[1-9][0-9]{5}\b/)?.[0] ?? '';
}

function extractState(address: string): string {
  const normalizedAddress = address.toLowerCase();
  return INDIAN_STATES.find((state) => normalizedAddress.includes(state.toLowerCase())) ?? '';
}

function extractCity(address: string, state: string, pincode: string): string {
  const withoutPincode = pincode ? address.replace(pincode, '') : address;
  const parts = withoutPincode
    .split(',')
    .map((part) => part.replace(/\s+-\s*$/, '').trim())
    .filter(Boolean);

  if (state) {
    const stateIndex = parts.findIndex((part) => part.toLowerCase().includes(state.toLowerCase()));
    if (stateIndex > 0) return parts[stateIndex - 1].replace(/\s+-\s*$/, '').trim();
  }

  return parts.length > 1 ? parts[parts.length - 2] : '';
}

function normalizeRows(rows: string[][]): CsvStoreRow[] {
  return rows.map((row, index) => {
    const [erpStoreCode, name, latitudeValue, longitudeValue, formattedAddress, isActiveValue] = row;

    if (!erpStoreCode || !name || !formattedAddress) {
      throw new Error(`Invalid Storeimport.csv row ${index + 1}: expected code, name, and formatted address.`);
    }

    const latitude = toNumber(latitudeValue);
    const longitude = toNumber(longitudeValue);
    const hadMissingCoordinates = latitude === null || longitude === null;

    return {
      erpStoreCode,
      name,
      latitude: latitude ?? DEFAULT_COORDINATE,
      longitude: longitude ?? DEFAULT_COORDINATE,
      formattedAddress,
      isActive: toBoolean(isActiveValue ?? '1'),
      hadMissingCoordinates,
    };
  });
}

async function seedStores() {
  const content = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
  const rows = normalizeRows(parseCsv(content));
  const missingCoordinateCount = rows.filter((row) => row.hadMissingCoordinates).length;

  if (IS_DRY_RUN) {
    console.log(`Parsed ${rows.length} store row(s) from ${path.basename(CSV_PATH)}.`);
    if (missingCoordinateCount > 0) {
      console.warn(
        `${missingCoordinateCount} row(s) are missing latitude/longitude and would use ${DEFAULT_COORDINATE},${DEFAULT_COORDINATE}.`,
      );
    }
    return;
  }

  await AppDataSource.initialize();

  const storeRepository = AppDataSource.getRepository(Store);
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    const pincode = extractPincode(row.formattedAddress);
    const state = extractState(row.formattedAddress);
    const city = extractCity(row.formattedAddress, state, pincode);
    const existing = await storeRepository.findOne({
      where: { erpStoreCode: row.erpStoreCode },
    });

    const store = storeRepository.create({
      ...(existing ?? {}),
      erpStoreCode: row.erpStoreCode,
      name: row.name,
      addressLine1: row.formattedAddress.slice(0, 255),
      formattedAddress: row.formattedAddress,
      placeId: existing?.placeId ?? null,
      city,
      state,
      pincode,
      country: 'India',
      latitude: row.latitude,
      longitude: row.longitude,
      deliveryRadiusKm: existing?.deliveryRadiusKm ?? DEFAULT_DELIVERY_RADIUS_KM,
      phone: existing?.phone ?? null,
      openingTime: existing?.openingTime ?? null,
      closingTime: existing?.closingTime ?? null,
      isActive: row.isActive,
    });

    await storeRepository.save(store);

    if (existing) updated += 1;
    else inserted += 1;
  }

  await AppDataSource.destroy();

  console.log(`Seeded stores from ${path.basename(CSV_PATH)}: ${inserted} inserted, ${updated} updated.`);
  if (missingCoordinateCount > 0) {
    console.warn(
      `${missingCoordinateCount} row(s) had missing latitude/longitude and were seeded with ${DEFAULT_COORDINATE},${DEFAULT_COORDINATE}.`,
    );
  }
}

seedStores().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
