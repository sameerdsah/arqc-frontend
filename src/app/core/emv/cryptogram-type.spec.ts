import { CRYPTOGRAM_TYPES, cryptogramTypeInfo, siblingPagePath, typeFromCid } from './cryptogram-type';

describe('cryptogram types', () => {
  it('knows the three cryptograms and their 9F27 values', () => {
    expect(CRYPTOGRAM_TYPES.map(t => [t.type, t.cid])).toEqual([['ARQC', '80'], ['TC', '40'], ['AAC', '00']]);
    expect(cryptogramTypeInfo('TC').meaning).toContain('approved');
  });

  it('reads the type from 9F27 (two highest bits)', () => {
    expect(typeFromCid('80')).toBe('ARQC');
    expect(typeFromCid('40')).toBe('TC');
    expect(typeFromCid('00')).toBe('AAC');
    expect(typeFromCid('81')).toBe('ARQC');     // lower bits carry other information
    expect(typeFromCid('c0')).toBeNull();       // 11: reserved
    expect(typeFromCid('8')).toBeNull();
    expect(typeFromCid(undefined)).toBeNull();
  });

  it('finds the page of another cryptogram of the same network', () => {
    expect(siblingPagePath('/visa/arqc', 'TC')).toBe('/visa/tc');
    expect(siblingPagePath('/discover/tc/', 'AAC')).toBe('/discover/aac');
    expect(siblingPagePath('/mastercard/aac', 'ARQC')).toBe('/mastercard/arqc');
    expect(siblingPagePath('/tools/verify', 'TC')).toBe('/tools/verify');
  });
});
