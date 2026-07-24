import * as XLSX from 'xlsx';

export interface ParsedInventoryRow {
  productCode: string;
  productName: string;
  productType: string;
  productStock: number;
  productPrice: number;
  productCompany: string;
}

export interface InventoryParseResult {
  rows: ParsedInventoryRow[];
  warnings: string[];
  fatalError: string | null;
}

const REQUIRED_HEADERS = [
  'Code',
  'Product Name',
  'Unit',
  'Current Stock',
  'M.R.P.',
  'Company',
];

export function parseInventoryFile(buffer: Buffer): InventoryParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    return {
      rows: [],
      warnings: [],
      fatalError: 'File could not be read. Upload a valid .xls file.',
    };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return { rows: [], warnings: [], fatalError: 'The uploaded file has no sheets.' };
  }

  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  });

  const headerRowIndex = rawRows.findIndex((row) =>
    row.some((cell) => String(cell).trim() === 'Code'),
  );

  if (headerRowIndex === -1) {
    return {
      rows: [],
      warnings: [],
      fatalError: 'Could not find the header row (expected a "Code" column).',
    };
  }

  const headerRow = rawRows[headerRowIndex].map((cell) => String(cell).trim());
  const columnIndex: Record<string, number> = {};
  for (const header of REQUIRED_HEADERS) {
    columnIndex[header] = headerRow.indexOf(header);
  }

  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => columnIndex[header] === -1,
  );
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      warnings: [],
      fatalError: `Missing required column(s): ${missingHeaders.join(', ')}`,
    };
  }

  const warnings: string[] = [];
  const rows: ParsedInventoryRow[] = [];
  const seenCodes = new Map<string, number>();

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const raw = rawRows[i];
    if (!raw) continue;

    const rowNum = i + 1;
    const productCode = String(raw[columnIndex['Code']] ?? '').trim();
    const productName = String(raw[columnIndex['Product Name']] ?? '').trim();
    const productType = String(raw[columnIndex['Unit']] ?? '').trim();
    const productCompany = String(raw[columnIndex['Company']] ?? '').trim();
    const stockRaw = raw[columnIndex['Current Stock']];
    const priceRaw = raw[columnIndex['M.R.P.']];

    const isBlankRow =
      !productCode &&
      !productName &&
      !productType &&
      !productCompany &&
      String(stockRaw ?? '').trim() === '' &&
      String(priceRaw ?? '').trim() === '';
    if (isBlankRow) continue;

    if (!productCode) {
      warnings.push(
        `Row ${rowNum}: missing Code — this record was not uploaded.`,
      );
      continue;
    }
    if (!productName) {
      warnings.push(
        `Row ${rowNum}: missing Product Name — this record was not uploaded.`,
      );
      continue;
    }
    if (seenCodes.has(productCode)) {
      warnings.push(
        `Row ${rowNum}: duplicate Code "${productCode}" (first seen on row ${seenCodes.get(productCode)}) — this record was not uploaded, the first one was kept.`,
      );
      continue;
    }

    const productStock = Number(stockRaw);
    if (stockRaw === '' || Number.isNaN(productStock)) {
      warnings.push(
        `Row ${rowNum}: Current Stock "${stockRaw}" is not a number — this record was not uploaded.`,
      );
      continue;
    }

    const productPrice = Number(priceRaw);
    if (priceRaw === '' || Number.isNaN(productPrice)) {
      warnings.push(
        `Row ${rowNum}: M.R.P. "${priceRaw}" is not a number — this record was not uploaded.`,
      );
      continue;
    }

    seenCodes.set(productCode, rowNum);
    rows.push({
      productCode,
      productName,
      productType,
      productStock,
      productPrice,
      productCompany,
    });
  }

  if (rows.length === 0) {
    return {
      rows: [],
      warnings,
      fatalError: 'No valid product rows found in the file.',
    };
  }

  return { rows, warnings, fatalError: null };
}
