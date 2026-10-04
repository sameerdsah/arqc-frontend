/**
 * EMV BER-TLV parsing for raw chip data, e.g. ISO 8583 field 55 copied from a log:
 *   9F0206000000010000 9F3704 12345678 ...
 * Pure functions: no Angular, no network - the data never leaves the browser.
 */

export interface TlvNode {
  tag: string;          // e.g. '9F02'
  length: number;       // value length in bytes
  value: string;        // hex, upper case
  children?: TlvNode[]; // constructed tags (templates such as 70 or 77)
}

export class TlvError extends Error {}

/** Names of the tags most often seen in field 55 (shown in the parsed table). */
export const EMV_TAG_NAMES: Record<string, string> = {
  '57': 'Track 2 Equivalent Data', '5A': 'PAN', '5F24': 'Expiry Date (YYMMDD)', '5F2A': 'Currency Code',
  '5F30': 'Service Code', '5F34': 'PAN Sequence Number', '70': 'Template', '77': 'Response Template',
  '82': 'Application Interchange Profile', '84': 'Dedicated File Name (AID)', '8A': 'Authorisation Response Code',
  '91': 'Issuer Authentication Data', '95': 'Terminal Verification Results', '9A': 'Transaction Date',
  '9C': 'Transaction Type', '9F02': 'Amount, Authorised', '9F03': 'Amount, Other', '9F09': 'Application Version Number',
  '9F10': 'Issuer Application Data', '9F1A': 'Terminal Country Code', '9F1E': 'Interface Device Serial Number',
  '9F26': 'Application Cryptogram (ARQC)', '9F27': 'Cryptogram Information Data', '9F33': 'Terminal Capabilities',
  '9F34': 'CVM Results', '9F35': 'Terminal Type', '9F36': 'Application Transaction Counter',
  '9F37': 'Unpredictable Number', '9F41': 'Transaction Sequence Counter', '9F53': 'Transaction Category Code',
  '9F6E': 'Form Factor Indicator / Third Party Data'
};

/** Accepts spaces, line breaks, colons and a 0x prefix; returns upper-case hex. */
export function cleanHex(input: string): string {
  const hex = input.replace(/^\s*0x/i, '').replace(/[\s:]/g, '').toUpperCase();
  if (!hex) {
    throw new TlvError('Paste the chip data first.');
  }
  if (!/^[0-9A-F]*$/.test(hex)) {
    throw new TlvError('The chip data must be hexadecimal (0-9, A-F).');
  }
  if (hex.length % 2) {
    throw new TlvError('The chip data has an odd number of characters - a character is missing.');
  }
  return hex;
}

/** Parses BER-TLV (multi-byte tags, 1-3 byte lengths, nested templates, 00/FF padding). */
export function parseTlv(input: string, maxDepth = 3): TlvNode[] {
  const hex = cleanHex(input);
  const bytes = hex.match(/../g)!.map(b => parseInt(b, 16));
  return parseRange(bytes, 0, bytes.length, maxDepth);
}

function parseRange(bytes: number[], start: number, end: number, depth: number): TlvNode[] {
  const nodes: TlvNode[] = [];
  const hexOf = (from: number, to: number) => bytes.slice(from, to).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  let i = start;
  while (i < end) {
    if (bytes[i] === 0x00 || bytes[i] === 0xFF) {   // padding between data objects
      i++;
      continue;
    }
    const tagStart = i;
    if ((bytes[i++] & 0x1F) === 0x1F) {             // multi-byte tag
      while (i < end && bytes[i] & 0x80) {
        i++;
      }
      i++;
    }
    if (i > end) {
      throw new TlvError(`Incomplete tag at byte ${tagStart + 1}.`);
    }
    const tag = hexOf(tagStart, i);
    if (i >= end) {
      throw new TlvError(`Tag ${tag} has no length.`);
    }
    let length = bytes[i++];
    if (length & 0x80) {
      const count = length & 0x7F;
      if (count < 1 || count > 2 || i + count > end) {
        throw new TlvError(`Tag ${tag} has an invalid length.`);
      }
      length = 0;
      for (let k = 0; k < count; k++) {
        length = (length << 8) | bytes[i++];
      }
    }
    if (i + length > end) {
      throw new TlvError(`Tag ${tag} says ${length} bytes, but the data ends early.`);
    }
    const node: TlvNode = { tag, length, value: hexOf(i, i + length) };
    if ((bytes[tagStart] & 0x20) && depth > 0) {     // constructed: parse the template's content
      node.children = parseRange(bytes, i, i + length, depth - 1);
    }
    nodes.push(node);
    i += length;
  }
  return nodes;
}

/** All primitive tags, templates flattened; the first occurrence of a tag wins. */
export function flattenTlv(nodes: TlvNode[]): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (list: TlvNode[]) => {
    for (const n of list) {
      if (n.children) {
        walk(n.children);
      } else if (!out.has(n.tag)) {
        out.set(n.tag, n.value);
      }
    }
  };
  walk(nodes);
  return out;
}

/** Tags that map one-to-one to an API field of the same EMV meaning. */
const DIRECT: Record<string, string> = {
  '9F02': 'tag_9f02', '9F03': 'tag_9f03', '9F1A': 'tag_9f1a', '95': 'tag_95', '5F2A': 'tag_5f2a', '9A': 'tag_9a',
  '9C': 'tag_9c', '9F37': 'tag_9f37', '82': 'tag_82', '9F36': 'tag_9f36', '9F10': 'tag_9f10', '8A': 'tag_8a'
};

export interface ChipValues {
  fields: Record<string, string>;   // API field name -> value, e.g. tag_9f02, pan, expiry, arqc
  sources: Record<string, string>;  // API field name -> the tag it came from, e.g. arqc -> 9F26
  usedTags: Set<string>;            // tags that produced a field
}

/**
 * Turns parsed tags into API field values:
 *   direct tags (9F02, 9F37, 9F10, 8A ...), 9F26 -> arqc, 9F27 -> cid, 5A -> pan,
 *   5F24 (YYMMDD) -> expiry (YYMM), 5F30 -> service_code,
 *   57 (track 2 equivalent) -> pan, expiry and service code,
 *   91 (issuer authentication data) -> arpc (its first 8 bytes).
 */
export function chipValues(tags: Map<string, string>): ChipValues {
  const fields: Record<string, string> = {};
  const sources: Record<string, string> = {};
  const usedTags = new Set<string>();
  const set = (field: string, value: string, tag: string) => {
    if (!(field in fields)) {
      fields[field] = value;
      sources[field] = tag;
      usedTags.add(tag);
    }
  };
  for (const [tag, field] of Object.entries(DIRECT)) {
    if (tags.has(tag)) {
      set(field, tags.get(tag)!, tag);
    }
  }
  if (tags.has('9F26')) {
    set('arqc', tags.get('9F26')!, '9F26');
  }
  if (tags.has('9F27')) {
    set('cid', tags.get('9F27')!, '9F27');   // cryptogram type (80 ARQC, 40 TC, 00 AAC)
  }
  if (tags.has('91') && tags.get('91')!.length >= 16) {
    set('arpc', tags.get('91')!.slice(0, 16), '91');
  }
  if (tags.has('5A')) {
    set('pan', tags.get('5A')!.replace(/F+$/, ''), '5A');
  }
  if (tags.has('5F24') && tags.get('5F24')!.length === 6) {
    set('expiry', tags.get('5F24')!.slice(0, 4), '5F24');
  }
  if (tags.has('5F30')) {
    set('service_code', tags.get('5F30')!.slice(-3), '5F30');
  }
  const track2 = tags.get('57')?.match(/^(\d{12,19})D(\d{4})(\d{3})/);
  if (track2) {
    set('pan', track2[1], '57');
    set('expiry', track2[2], '57');
    set('service_code', track2[3], '57');
  }
  return { fields, sources, usedTags };
}

/** API field name -> EMV tag, the reverse of chipValues (used to build example chip data). */
export function tagForField(field: string): string | null {
  const direct = Object.entries(DIRECT).find(([, f]) => f === field);
  if (direct) {
    return direct[0];
  }
  return ({ arqc: '9F26', cid: '9F27', pan: '5A', expiry: '5F24', service_code: '5F30' } as Record<string, string>)[field] ?? null;
}

/** Encodes one API field value as the chip would carry it (expiry YYMM -> YYMMDD, service code -> 2 bytes). */
export function chipEncode(field: string, value: string): string {
  if (field === 'expiry') {
    return value + '01';
  }
  if (field === 'service_code') {
    return '0' + value;
  }
  if (field === 'pan' && value.length % 2) {
    return value + 'F';
  }
  return value;
}

/** Builds TLV hex from tag/value pairs (used for examples and tests). */
export function buildTlv(pairs: [string, string][]): string {
  return pairs.map(([tag, value]) => tag + (value.length / 2).toString(16).padStart(2, '0').toUpperCase() + value).join('');
}
