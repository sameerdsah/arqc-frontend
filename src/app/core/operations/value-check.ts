import { DiagnosisFinding, Explanation } from './operations.models';

/**
 * Pure helpers for checking a received value (no Angular, no HTTP), shared by the generator
 * pages and the Verify page.
 */

export const IDLE: Explanation = { status: 'idle' };
export const LOADING: Explanation = { status: 'loading' };

export interface DiffChar {
  char: string;
  same: boolean;
}

/** Marks each character of `received` that differs from `expected` (same position). */
export function compareChars(expected: string, received: string): DiffChar[] {
  return [...received].map((char, i) => ({ char, same: expected[i] === char }));
}

/** The format of a calculated value, used to check the received one: '3 digits', '16 hex characters'. */
export function resultFormat(result: string): { description: string; pattern: RegExp } {
  return /^[0-9]+$/.test(result)
    ? { description: `${result.length} digits`, pattern: new RegExp(`^[0-9]{${result.length}}$`) }
    : { description: `${result.length} hex characters`, pattern: new RegExp(`^[0-9A-F]{${result.length}}$`, 'i') };
}

/** Normalises a received value the way the API does: surrounding spaces removed, upper case. */
export function normaliseReceived(value: string): string {
  return value.trim().toUpperCase();
}

/** The finding to show, if the explanation found one. */
export function findingOf(explanation: Explanation): DiagnosisFinding | null {
  return explanation.status === 'done' ? explanation.diagnosis.findings[0] ?? null : null;
}

/** Field changes of a finding as an input patch: { tag_9f36: '0002' }. */
export function changesOf(finding: DiagnosisFinding): Record<string, string> {
  return Object.fromEntries(finding.changes.map(c => [c.field, c.to]));
}

/** True when `input` already holds every change of `finding` (the change was applied). */
export function isApplied(finding: DiagnosisFinding | null, input: Record<string, string> | null | undefined): boolean {
  return !!finding && !!input && finding.changes.length > 0 &&
    finding.changes.every(c => (input[c.field] ?? '').toUpperCase() === c.to.toUpperCase());
}

/** Readable name of an API field for reports: tag_9f02 -> 'Tag 9F02', pan -> 'PAN'. */
export function fieldTitle(name: string): string {
  const tag = /^tag_([0-9a-f]+)$/i.exec(name);
  if (tag) {
    return `Tag ${tag[1].toUpperCase()}`;
  }
  return ({ pan: 'PAN', expiry: 'Expiry (YYMM)', service_code: 'Service code', arqc: 'ARQC (9F26)' } as
    Record<string, string>)[name] ?? name;
}

export interface CheckReportData {
  value: string;                       // e.g. 'Visa ARQC' or 'ARQC (POST /api/visa/arqc)'
  input: Record<string, string>;
  expected: string;
  received: string;
  explanation?: Explanation;
  link?: string;                       // shareable check link (reopens the same check)
}

/**
 * A plain-text summary of a check, ready to paste into a defect ticket or a chat:
 * everything needed to reproduce it, and the cause if one was found.
 */
export function checkReport(data: CheckReportData): string {
  const match = data.expected === data.received;
  const lines = [
    'Cryptogram Generator - value check',
    `Value:     ${data.value}`,
    `Outcome:   ${match ? 'MATCH' : 'NO MATCH'}`,
    `Expected:  ${data.expected}`,
    `Received:  ${data.received}`,
    'Input:',
    ...Object.entries(data.input).map(([name, value]) => `  ${fieldTitle(name).padEnd(15)} ${value}`)
  ];
  const explanation = data.explanation ?? IDLE;
  const finding = findingOf(explanation);
  if (!match && finding) {
    lines.push(`Likely cause (${finding.confidence}): ${finding.explanation}`);
    for (const c of finding.changes) {
      lines.push(`  Change ${fieldTitle(c.field)}: ${c.from} -> ${c.to}`);
    }
    if (finding.note) {
      lines.push(`  Note: ${finding.note}`);
    }
  } else if (!match && explanation.status === 'done') {
    lines.push(`Likely cause: none of ${explanation.diagnosis.checked} common input mistakes reproduces the received ` +
               'value (check the key, the cryptogram version and the card data).');
  }
  if (data.link) {
    lines.push(`Link:      ${data.link}`);
  }
  lines.push('Test data and test keys only.');
  return lines.join('\n');
}
