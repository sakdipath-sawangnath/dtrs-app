import type { CellFormulaValue, CellRichTextValue } from 'exceljs';
import ExcelJS from 'exceljs';

function stringifyHeader(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (
    typeof v === 'object' &&
    v !== null &&
    'richText' in v &&
    Array.isArray((v as CellRichTextValue).richText)
  ) {
    return (v as CellRichTextValue).richText
      .map((r) => r.text)
      .join('')
      .trim();
  }
  return String(v).trim();
}

function plainCellValue(cell: ExcelJS.Cell): unknown {
  const v = cell.value;
  if (v === null || v === undefined) return undefined;
  if (
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    v instanceof Date
  ) {
    return v;
  }
  if (typeof v === 'object') {
    if ('result' in v && (v as CellFormulaValue).result !== undefined) {
      return (v as CellFormulaValue).result;
    }
    if ('richText' in v && Array.isArray(v.richText)) {
      return v.richText.map((r) => r.text).join('');
    }
  }
  return v;
}

/** พฤติกรรมใกล้เคียง xlsx.utils.sheet_to_json (แถวแรก = หัวคอลัมน์) */
export function worksheetToRecords(
  ws: ExcelJS.Worksheet | undefined,
): Record<string, unknown>[] {
  if (!ws || ws.rowCount < 2) return [];
  const headerRow = ws.getRow(1);
  const colCount = Math.max(headerRow.cellCount, 1);
  const keys: string[] = [];
  for (let c = 1; c <= colCount; c++) {
    const cell = headerRow.getCell(c);
    keys[c - 1] = stringifyHeader(cell.value);
  }
  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const obj: Record<string, unknown> = {};
    let has = false;
    for (let c = 1; c <= colCount; c++) {
      const key = keys[c - 1];
      if (!key) continue;
      const cell = row.getCell(c);
      const val = plainCellValue(cell);
      if (val !== undefined && val !== '') has = true;
      obj[key] = val === '' ? undefined : val;
    }
    if (has) rows.push(obj);
  }
  return rows;
}

export async function loadWorkbookXlsx(
  path: string,
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  return wb;
}
