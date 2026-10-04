import { findGuide, GUIDES } from './learn-guides';

describe('Learn guides', () => {
  it('has unique addresses and complete content', () => {
    expect(new Set(GUIDES.map(g => g.slug)).size).toBe(GUIDES.length);
    for (const g of GUIDES) {
      expect(g.slug).toMatch(/^[a-z0-9-]+$/);
      expect(g.title.length).toBeGreaterThan(5);
      expect(g.summary.length).toBeGreaterThan(20);
      expect(g.sections.length).toBeGreaterThan(0);
      expect(g.tryIt.length).toBeGreaterThan(0);
      for (const link of g.tryIt) {
        expect(link.url.startsWith('/')).toBe(true);        // stays inside the app
      }
    }
  });

  it('finds a guide by its address', () => {
    expect(findGuide('emv-tags')?.kind).toBe('Reference');
    expect(findGuide('nothing')).toBeNull();
    expect(findGuide(null)).toBeNull();
  });
});
