import { addRecent, outcomeText, readRecent, RECENT_LIMIT, RecentCheck, relativeLink, timeAgo } from './recent-checks';

const check = (received: string, extra: Partial<RecentCheck> = {}): RecentCheck => ({
  path: '/visa/arqc', valueName: 'ARQC', received, outcome: 'match',
  link: `/visa/arqc?tag_9f36=0001&received=${received}`, at: '2026-10-04T09:00:00.000Z', ...extra
});

describe('recent checks', () => {
  it('keeps the newest first, each check once, and at most five', () => {
    let list: RecentCheck[] = [];
    for (let i = 0; i < 7; i++) {
      list = addRecent(list, check(`00000000000000A${i}`));
    }
    expect(list.length).toBe(RECENT_LIMIT);
    expect(list[0].received).toBe('00000000000000A6');
    list = addRecent(list, check('00000000000000A3', { outcome: 'mismatch' }));
    expect(list.filter(c => c.received === '00000000000000A3').length).toBe(1);
    expect(list[0].outcome).toBe('mismatch');
  });

  it('stores links without the site address, so they work on v1 and v2', () => {
    expect(relativeLink('https://emv-crypto-v2.duckdns.org/visa/arqc?received=AB')).toBe('/visa/arqc?received=AB');
    expect(relativeLink('/visa/arqc?received=AB')).toBe('/visa/arqc?received=AB');
  });

  it('reads stored checks defensively', () => {
    const good = check('949BBD6013450C7D');
    expect(readRecent(JSON.stringify([good]))).toEqual([good]);
    expect(readRecent(null)).toEqual([]);
    expect(readRecent('not json')).toEqual([]);
    expect(readRecent('{"a":1}')).toEqual([]);
    const bad = [
      { ...good, link: 'https://evil.example/visa/arqc' },     // a link to another site
      { ...good, link: '/amex/cid?received=1' },               // a link to another page
      { ...good, received: '<b>' },
      { ...good, outcome: 'maybe' },
      { ...good, at: 'yesterday' },
      { ...good, path: 'javascript:alert(1)' }
    ];
    expect(readRecent(JSON.stringify([...bad, good]))).toEqual([good]);
  });

  it('describes the outcome and when it happened', () => {
    expect(outcomeText(check('1'))).toBe('Match');
    expect(outcomeText(check('1', { outcome: 'mismatch', cause: 'Transaction counter (9F36)' })))
      .toBe('No match · Transaction counter (9F36)');
    expect(outcomeText(check('1', { outcome: 'mismatch' }))).toBe('No match');
    const now = new Date('2026-10-04T12:00:00Z');
    expect(timeAgo('2026-10-04T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-10-04T11:45:00Z', now)).toBe('15 min ago');
    expect(timeAgo('2026-10-04T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2026-10-01T09:00:00Z', now)).toBe('1 Oct');
  });
});
