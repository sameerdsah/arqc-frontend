import { BatchItem, BatchItemResult, BatchResult, OperationInfo } from '../../core/operations/operations.models';

/** Columns with a special meaning; every other column must be an input field of the operation. */
export const REF_COLUMN = 'ref';
export const RECEIVED_COLUMN = 'received';

export interface ParsedBatch {
  items: BatchItem[];
  errors: string[];          // problems that stop the batch
  ignoredColumns: string[];  // columns that are not used (shown as a hint)
}

/** CSV template for an operation: header row plus one example row. */
export function buildTemplate(op: OperationInfo): string[][] {
  return [
    [REF_COLUMN, ...op.fields.map(f => f.name), RECEIVED_COLUMN],
    ['row-1', ...op.fields.map(f => f.example), '']
  ];
}

/** Turns CSV rows (first row = header) into batch items for the operation. */
export function csvToBatchItems(rows: string[][], op: OperationInfo, maxItems: number): ParsedBatch {
  const errors: string[] = [];
  if (rows.length < 2) {
    return { items: [], errors: ['The file needs a header row and at least one data row.'], ignoredColumns: [] };
  }
  const header = rows[0].map(h => h.trim().toLowerCase());
  const fieldNames = op.fields.map(f => f.name);
  const missing = fieldNames.filter(name => !header.includes(name));
  if (missing.length) {
    errors.push(`Missing column(s) for ${op.label}: ${missing.join(', ')}. Download the template to see the expected columns.`);
  }
  const known = new Set([REF_COLUMN, RECEIVED_COLUMN, ...fieldNames]);
  const ignoredColumns = header.filter(h => h && !known.has(h));
  const dataRows = rows.slice(1);
  if (dataRows.length > maxItems) {
    errors.push(`The file has ${dataRows.length} rows; a batch can contain at most ${maxItems}.`);
  }
  if (errors.length) {
    return { items: [], errors, ignoredColumns };
  }

  const column = (name: string) => header.indexOf(name);
  const items = dataRows.map((cells, i) => {
    const cell = (name: string) => (column(name) >= 0 ? (cells[column(name)] ?? '').trim() : '');
    const item: BatchItem = {
      ref: cell(REF_COLUMN) || `row-${i + 1}`,
      input: Object.fromEntries(fieldNames.map(name => [name, cell(name)]))
    };
    const received = cell(RECEIVED_COLUMN);
    if (received) {
      item.received = received;
    }
    return item;
  });
  return { items, errors: [], ignoredColumns };
}

export type ItemStatus = 'MATCH' | 'MISMATCH' | 'GENERATED' | 'ERROR';

export function itemStatus(result: BatchItemResult): ItemStatus {
  if (result.error) {
    return 'ERROR';
  }
  if (result.valid === undefined) {
    return 'GENERATED';
  }
  return result.valid ? 'MATCH' : 'MISMATCH';
}

/** Results as CSV: the submitted values plus result, status and error for every row. */
export function resultsToCsv(op: OperationInfo, items: BatchItem[], result: BatchResult): string[][] {
  const fieldNames = op.fields.map(f => f.name);
  const header = [REF_COLUMN, ...fieldNames, RECEIVED_COLUMN, 'result', 'status', 'error'];
  const rows = result.results.map(r => {
    const item = items[r.index];
    return [r.ref ?? item?.ref ?? '', ...fieldNames.map(n => item?.input[n] ?? ''), item?.received ?? '',
            r.result ?? '', itemStatus(r), r.error ?? ''];
  });
  return [header, ...rows];
}
