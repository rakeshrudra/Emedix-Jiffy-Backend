import * as XLSX from 'xlsx';

export interface ParsedInventoryRow {
  product_code: string;
  product_name: string;
  product_type: string;
  product_stock: number;
  product_price: number;
  product_company: string;
}

export interface InventoryParseResult {
  rows: ParsedInventoryRow[];
  warnings: string[];
  fatal_error: string | null;
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
      fatal_error: 'File could not be read. Upload a valid .xls file.',
    };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return { rows: [], warnings: [], fatal_error: 'The uploaded file has no sheets.' };
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
      fatal_error: 'Could not find the header row (expected a "Code" column).',
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
      fatal_error: `Missing required column(s): ${missingHeaders.join(', ')}`,
    };
  }

  const warnings: string[] = [];
  const rows: ParsedInventoryRow[] = [];
  const seenCodes = new Map<string, number>();

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const raw = rawRows[i];
    if (!raw) continue;

    const rowNum = i + 1;
    const product_code = String(raw[columnIndex['Code']] ?? '').trim();
    const product_name = String(raw[columnIndex['Product Name']] ?? '').trim();
    const product_type = String(raw[columnIndex['Unit']] ?? '').trim();
    const product_company = String(raw[columnIndex['Company']] ?? '').trim();
    const stockRaw = raw[columnIndex['Current Stock']];
    const priceRaw = raw[columnIndex['M.R.P.']];

    const isBlankRow =
      !product_code &&
      !product_name &&
      !product_type &&
      !product_company &&
      String(stockRaw ?? '').trim() === '' &&
      String(priceRaw ?? '').trim() === '';
    if (isBlankRow) continue;

    if (!product_code) {
      warnings.push(
        `Row ${rowNum}: missing Code — this record was not uploaded.`,
      );
      continue;
    }
    if (!product_name) {
      warnings.push(
        `Row ${rowNum}: missing Product Name — this record was not uploaded.`,
      );
      continue;
    }
    if (seenCodes.has(product_code)) {
      warnings.push(
        `Row ${rowNum}: duplicate Code "${product_code}" (first seen on row ${seenCodes.get(product_code)}) — this record was not uploaded, the first one was kept.`,
      );
      continue;
    }

    const product_stock = Number(stockRaw);
    if (stockRaw === '' || Number.isNaN(product_stock)) {
      warnings.push(
        `Row ${rowNum}: Current Stock "${stockRaw}" is not a number — this record was not uploaded.`,
      );
      continue;
    }

    const product_price = Number(priceRaw);
    if (priceRaw === '' || Number.isNaN(product_price)) {
      warnings.push(
        `Row ${rowNum}: M.R.P. "${priceRaw}" is not a number — this record was not uploaded.`,
      );
      continue;
    }

    seenCodes.set(product_code, rowNum);
    rows.push({
      product_code,
      product_name,
      product_type,
      product_stock,
      product_price,
      product_company,
    });
  }

  if (rows.length === 0) {
    return {
      rows: [],
      warnings,
      fatal_error: 'No valid product rows found in the file.',
    };
  }

  return { rows, warnings, fatal_error: null };
}
