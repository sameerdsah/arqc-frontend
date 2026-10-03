import { buildCheckLink, readCheckLink } from './check-link';

describe('check links', () => {
  it('builds a link with the inputs and the received value', () => {
    const link = buildCheckLink('https://emv-crypto.duckdns.org', '/discover/arpc?old=1',
                                { arqc: '37858601E2285A5D', tag_8a: '0000' }, 'C837D13061C1E896');
    expect(link).toBe('https://emv-crypto.duckdns.org/discover/arpc?arqc=37858601E2285A5D&tag_8a=0000&received=C837D13061C1E896');
    expect(buildCheckLink('https://x', '/tools/verify', { pan: '4111' }, '597', { operation: 'visa/cvv2' }))
      .toBe('https://x/tools/verify?operation=visa%2Fcvv2&pan=4111&received=597');
  });

  it('reads a link only when it has every field and a received value', () => {
    expect(readCheckLink('?arqc=37858601E2285A5D&tag_8a=0000&received=C837D13061C1E896', ['arqc', 'tag_8a']))
      .toEqual({ input: { arqc: '37858601E2285A5D', tag_8a: '0000' }, received: 'C837D13061C1E896' });
    expect(readCheckLink('?arqc=37858601E2285A5D&received=C837D13061C1E896', ['arqc', 'tag_8a'])).toBeNull();
    expect(readCheckLink('?arqc=37858601E2285A5D&tag_8a=0000', ['arqc', 'tag_8a'])).toBeNull();
    expect(readCheckLink('', ['arqc'])).toBeNull();
  });
});
