import { buildTlv, chipValues, cleanHex, flattenTlv, parseTlv, TlvError } from './tlv';

const VISA_FIELD_55 = buildTlv([
  ['9F02', '000000010000'], ['9F03', '000000000000'], ['9F1A', '0826'], ['95', '0000000000'],
  ['5F2A', '0826'], ['9A', '261001'], ['9C', '00'], ['9F37', '12345678'], ['82', '3C00'],
  ['9F36', '0001'], ['9F10', '06010A03A00000'], ['9F26', '949BBD6013450C7D'], ['9F27', '80']]);

describe('EMV TLV parser', () => {
  it('parses field 55 into tags, including two-byte tags', () => {
    const nodes = parseTlv(VISA_FIELD_55);
    expect(nodes.length).toBe(13);
    expect(nodes[0]).toEqual({ tag: '9F02', length: 6, value: '000000010000' });
    expect(nodes[3]).toEqual({ tag: '95', length: 5, value: '0000000000' });
  });

  it('accepts spaces, line breaks, colons, lower case and a 0x prefix', () => {
    expect(cleanHex('0x9f02 06:00\n0000 010000')).toBe('9F0206000000010000');
    expect(parseTlv('9f36 02 0001')[0]).toEqual({ tag: '9F36', length: 2, value: '0001' });
  });

  it('reads long lengths (81 / 82) and nested templates, and skips padding', () => {
    const long = '9F10' + '81' + '82' + '00'.repeat(0x82);
    expect(parseTlv(long)[0].length).toBe(0x82);
    const nested = parseTlv('00' + '77' + '09' + '9F2701' + '80' + '9F3602' + '0001' + 'FF');
    expect(nested[0].tag).toBe('77');
    expect(nested[0].children!.map(c => c.tag)).toEqual(['9F27', '9F36']);
    expect(flattenTlv(nested).get('9F36')).toBe('0001');
  });

  it('gives clear errors for broken data', () => {
    const message = (s: string) => { try { parseTlv(s); return ''; } catch (e) { return (e as TlvError).message; } };
    expect(message('')).toContain('Paste the chip data');
    expect(message('9F02XY')).toContain('hexadecimal');
    expect(message('9F0')).toContain('odd number');
    expect(message('9F0206000000')).toContain('ends early');
    expect(message('9F02')).toContain('no length');
  });

  it('maps tags to API fields: direct tags, 9F26 -> arqc, 9F27 -> cid, 91 -> arpc', () => {
    const { fields, usedTags } = chipValues(flattenTlv(parseTlv(VISA_FIELD_55 + buildTlv([['8A', '3030'], ['91', 'C837D13061C1E8963030']]))));
    expect(fields['tag_9f02']).toBe('000000010000');
    expect(fields['tag_9f10']).toBe('06010A03A00000');
    expect(fields['tag_82']).toBe('3C00');
    expect(fields['arqc']).toBe('949BBD6013450C7D');
    expect(fields['tag_8a']).toBe('3030');
    expect(fields['arpc']).toBe('C837D13061C1E896');
    expect(fields['cid']).toBe('80');                // the cryptogram type (9F27)
    expect(usedTags.has('9F27')).toBe(true);
  });

  it('reads card data from 5A / 5F24 / 5F30 or from track 2 equivalent data (57)', () => {
    const fromTags = chipValues(flattenTlv(parseTlv(buildTlv([['5A', '4111111111111111'], ['5F24', '301231'], ['5F30', '0201']]))));
    expect(fromTags.fields).toEqual({ pan: '4111111111111111', expiry: '3012', service_code: '201' });
    const fromTrack2 = chipValues(flattenTlv(parseTlv(buildTlv([['57', '4111111111111111D3012201123456789F']]))));
    expect(fromTrack2.fields).toEqual({ pan: '4111111111111111', expiry: '3012', service_code: '201' });
    const oddPan = chipValues(flattenTlv(parseTlv(buildTlv([['5A', '412345678901234F']]))));
    expect(oddPan.fields['pan']).toBe('412345678901234');
  });
});
