/**
 * Small, dependency-free CSV helpers (RFC 4180): quoted fields, "" escapes, commas and
 * line breaks inside quotes, CRLF or LF line ends, UTF-8 BOM from Excel.
 */

/** Parses CSV text into rows of cells. Completely empty lines are skipped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');

  const endRow = () => {
    row.push(cell);
    if (row.some(c => c.trim() !== '')) {
      rows.push(row);
    }
    row = [];
    cell = '';
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') {
        i++;
      }
      endRow();
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) {
    endRow();
  }
  return rows;
}

/**
 * Builds CSV text. Cells are quoted when needed; cells starting with = + - @ are
 * prefixed with ' so spreadsheet programs never run them as formulas (CSV injection).
 */
export function toCsv(rows: string[][]): string {
  const escape = (value: string) => {
    let v = value ?? '';
    if (/^[=+\-@\t\r]/.test(v)) {
      v = `'${v}`;
    }
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  return rows.map(r => r.map(escape).join(',')).join('\r\n') + '\r\n';
}

/** Lets the user save text as a file (works in the browser and in the desktop app). */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
