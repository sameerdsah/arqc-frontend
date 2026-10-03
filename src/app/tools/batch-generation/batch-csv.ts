import {
  BatchItem, BatchItemResult, BatchResult, DiagnosisFinding, OperationInfo
} from '../../core/operations/operations.models';

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

/**
 * Sample rows that show every outcome with one click: a value to generate, a match, a mismatch
 * with a known cause (the input changed the way a real mistake would change it) and a value no
 * common cause explains. Built from the catalogue's example, so it works for every operation.
 */
export function sampleRows(op: OperationInfo): string[][] {
  const [header, example] = buildTemplate(op);
  const input = (changes: Record<string, string> = {}) => op.fields.map(f => changes[f.name] ?? f.example);
  const rows = [header, ['generate', ...input(), '']];
  const expected = op.example_result;
  if (!expected) {
    return [...rows, ['generate-2', ...example.slice(1, -1), ''], ['generate-3', ...example.slice(1, -1), '']];
  }
  rows.push(['match', ...input(), expected]);
  const mistake = knownMistake(op);
  if (mistake) {
    rows.push([mistake.ref, ...input(mistake.changes), expected]);
  }
  const unknown = /^[0-9]+$/.test(expected) ? '9'.repeat(expected.length) : '0123456789ABCDEF'.slice(0, expected.length);
  rows.push(['unknown-value', ...input(), unknown === expected ? unknown.split('').reverse().join('') : unknown]);
  return rows;
}

/** An input change that a real mistake would make, for the operation's fields (first one that applies). */
function knownMistake(op: OperationInfo): { ref: string; changes: Record<string, string> } | null {
  const example = (name: string) => op.fields.find(f => f.name === name)?.example;
  const atc = example('tag_9f36');
  if (atc && /^[0-9A-Fa-f]{4}$/.test(atc)) {
    const next = ((parseInt(atc, 16) + 1) % 0x10000).toString(16).toUpperCase().padStart(4, '0');
    return { ref: 'counter-moved-on', changes: { tag_9f36: next } };
  }
  const arc = example('tag_8a');
  if (arc && /^3[0-9]3[0-9]$/.test(arc)) {
    return { ref: 'response-code-raw', changes: { tag_8a: `0${arc[1]}0${arc[3]}` } };
  }
  const pan = example('pan');
  if (pan) {
    const i = [...pan].findIndex((d, k) => k < pan.length - 1 && d !== pan[k + 1]);
    if (i >= 0) {
      return { ref: 'pan-typo', changes: { pan: pan.slice(0, i) + pan[i + 1] + pan[i] + pan.slice(i + 2) } };
    }
  }
  return null;
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

export const UNEXPLAINED = 'unexplained';

/** The cause of a mismatched item: its finding, or "unexplained"; null when there is nothing to explain. */
export function itemCause(result: BatchItemResult): { cause: string; finding: DiagnosisFinding | null } | null {
  if (!result.diagnosis) {
    return null;
  }
  const finding = result.diagnosis.findings[0] ?? null;
  return { cause: finding?.cause ?? UNEXPLAINED, finding };
}

/** The fix as short text, e.g. "tag_9f36: 0001 -> 0002" or "it is the Discover CID". */
export function fixText(finding: DiagnosisFinding | null): string {
  if (!finding) {
    return '';
  }
  if (finding.operation) {
    return `it is the ${finding.operation.label}`;
  }
  return finding.changes.map(c => `${c.field}: ${c.from} -> ${c.to}`).join('; ');
}

/** Results as CSV: the submitted values plus result, status, error and - for mismatches - the cause. */
export function resultsToCsv(op: OperationInfo, items: BatchItem[], result: BatchResult): string[][] {
  const fieldNames = op.fields.map(f => f.name);
  const explained = result.results.some(r => r.diagnosis);
  const header = [REF_COLUMN, ...fieldNames, RECEIVED_COLUMN, 'result', 'status', 'error',
                  ...(explained ? ['cause', 'confidence', 'fix', 'explanation'] : [])];
  const rows = result.results.map(r => {
    const item = items[r.index];
    const row = [r.ref ?? item?.ref ?? '', ...fieldNames.map(n => item?.input[n] ?? ''), item?.received ?? '',
                 r.result ?? '', itemStatus(r), r.error ?? ''];
    if (explained) {
      const c = itemCause(r);
      const f = c?.finding ?? null;
      row.push(c ? (f ? f.title ?? f.cause : 'No common cause found') : '', f?.confidence ?? '', fixText(f),
               f?.explanation ?? '');
    }
    return row;
  });
  return [header, ...rows];
}
