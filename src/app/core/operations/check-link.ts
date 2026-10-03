/**
 * Shareable check links: the page address plus the inputs and the received value as query
 * parameters, e.g. /visa/arqc?tag_9f02=000000010000&...&received=949BBD6013450C7D.
 * Opening the link fills the page and runs the check, so a developer sees the same Match or
 * No match - and the same cause - as the tester who reported it. Test data only, by design.
 */

export const RECEIVED_PARAM = 'received';
export const OPERATION_PARAM = 'operation';

export interface CheckLink {
  input: Record<string, string>;
  received: string;
}

/** Absolute link for a page path (e.g. '/visa/arqc') with the input fields and the received value. */
export function buildCheckLink(origin: string, path: string, input: Record<string, string>, received: string,
                               extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ ...extra, ...input, [RECEIVED_PARAM]: received });
  return `${origin}${path.split(/[?#]/)[0]}?${params.toString()}`;
}

/**
 * Reads a check link from a query string for a page with these input fields.
 * Null unless the link has every field and a received value, so a partial or unrelated
 * query string never changes the page.
 */
export function readCheckLink(search: string, fieldNames: string[]): CheckLink | null {
  const params = new URLSearchParams(search);
  const received = (params.get(RECEIVED_PARAM) ?? '').trim();
  if (!received || !fieldNames.length || !fieldNames.every(name => params.has(name))) {
    return null;
  }
  return { input: Object.fromEntries(fieldNames.map(name => [name, (params.get(name) ?? '').trim()])), received };
}

/** The query string of the current page ('' outside a browser). */
export function currentSearch(): string {
  return typeof location !== 'undefined' ? location.search : '';
}
