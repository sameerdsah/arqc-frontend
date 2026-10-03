import { breadcrumb, headerLinks, NETWORK_CONFIG, NETWORKS, pageTitle, parseUrl, valueSwitcher } from './navigation';

describe('navigation (site map)', () => {
  it('reads addresses', () => {
    expect(parseUrl('/visa/arqc')).toEqual({ network: 'visa', tool: 'arqc', testingTool: null, valid: true });
    expect(parseUrl('/tools/verify').testingTool).toBe('verify');
    expect(parseUrl('/mastercard/cvv').valid).toBe(false);
  });

  it('builds the header from the site map, with the current section active', () => {
    const { networks, tools } = headerLinks(parseUrl('/amex/arpc'));
    expect(networks.map(n => n.label)).toEqual(['Discover', 'Mastercard', 'Visa', 'Amex']);
    expect(networks.map(n => n.url)).toEqual(['/discover', '/mastercard', '/visa', '/amex']);
    expect(networks.filter(n => n.active).map(n => n.label)).toEqual(['Amex']);
    expect(networks[3].title).toContain('American Express');
    expect(tools.map(t => [t.label, t.url])).toEqual([['Verify', '/tools/verify'], ['Batch', '/tools/batch']]);
    expect(headerLinks(parseUrl('/tools/batch')).tools.map(t => t.active)).toEqual([false, true]);
  });

  it('builds the breadcrumb', () => {
    expect(breadcrumb(parseUrl('/'))).toEqual([]);
    expect(breadcrumb(parseUrl('/visa')).map(c => [c.label, c.url, c.active]))
      .toEqual([['Home', '/', false], ['Visa', '/visa', true]]);
    expect(breadcrumb(parseUrl('/visa/arqc')).map(c => [c.label, c.url, c.active]))
      .toEqual([['Home', '/', false], ['Visa', '/visa', false], ['ARQC', '/visa/arqc', true]]);
    expect(breadcrumb(parseUrl('/tools/verify')).map(c => c.label)).toEqual(['Home', 'Verify a Value']);
  });

  it('offers the other values of the same network, and the other testing tools', () => {
    expect(valueSwitcher(parseUrl('/'))).toEqual([]);
    expect(valueSwitcher(parseUrl('/visa'))).toEqual([]);
    const visa = valueSwitcher(parseUrl('/visa/arqc'));
    expect(visa.map(l => l.label)).toEqual(['ARQC', 'ARPC', 'CVV', 'CVV2', 'iCVV', 'dCVV']);
    expect(visa.filter(l => l.active).map(l => l.url)).toEqual(['/visa/arqc']);
    expect(valueSwitcher(parseUrl('/tools/verify')).map(l => l.label)).toEqual(['Verify a Value', 'Batch Generation']);
  });

  it('names the browser tab after the page', () => {
    expect(pageTitle(parseUrl('/'))).toBe('Cryptogram Generator');
    expect(pageTitle(parseUrl('/amex'))).toBe('American Express · Cryptogram Generator');
    expect(pageTitle(parseUrl('/visa/arqc'))).toBe('Visa ARQC · Cryptogram Generator');
    expect(pageTitle(parseUrl('/tools/batch'))).toBe('Batch Generation · Cryptogram Generator');
  });

  it('gives every value of every network a switcher entry (nothing left out)', () => {
    for (const n of NETWORKS) {
      for (const t of NETWORK_CONFIG[n].tools) {
        expect(valueSwitcher(parseUrl(`/${n}/${t.slug}`)).filter(l => l.active).length).toBe(1);
      }
    }
  });
});
