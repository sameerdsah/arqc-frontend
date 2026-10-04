/**
 * The three Application Cryptograms a chip can return from GENERATE AC.
 * The calculation is the same; the Cryptogram Information Data (tag 9F27) says which one it is,
 * and the card records its decision in the CVR inside 9F10. Pure data and helpers (no Angular).
 */

export type CryptogramType = 'ARQC' | 'TC' | 'AAC';

export interface CryptogramTypeInfo {
  type: CryptogramType;
  cid: string;          // tag 9F27
  name: string;
  meaning: string;      // what the card is saying
}

export const CRYPTOGRAM_TYPES: CryptogramTypeInfo[] = [
  { type: 'ARQC', cid: '80', name: 'Authorisation Request Cryptogram', meaning: 'go online: the issuer decides' },
  { type: 'TC', cid: '40', name: 'Transaction Certificate', meaning: 'approved: kept as proof of the payment' },
  { type: 'AAC', cid: '00', name: 'Application Authentication Cryptogram', meaning: 'declined' }
];

export function cryptogramTypeInfo(type: CryptogramType): CryptogramTypeInfo {
  return CRYPTOGRAM_TYPES.find(t => t.type === type)!;
}

/** 9F27 -> type, from its two highest bits (00 AAC, 01 TC, 10 ARQC); null when not a valid byte or reserved (11). */
export function typeFromCid(cid: string | undefined | null): CryptogramType | null {
  if (!cid || !/^[0-9A-Fa-f]{2}$/.test(cid)) {
    return null;
  }
  const bits = parseInt(cid, 16) & 0xC0;
  return bits === 0x80 ? 'ARQC' : bits === 0x40 ? 'TC' : bits === 0x00 ? 'AAC' : null;
}

/** The page of another cryptogram of the same network: /visa/arqc -> /visa/tc. */
export function siblingPagePath(pathname: string, type: CryptogramType): string {
  const base = pathname.split(/[?#]/)[0].replace(/\/+$/, '');
  return /\/(arqc|tc|aac)$/i.test(base) ? base.replace(/[^/]+$/, type.toLowerCase()) : base;
}
