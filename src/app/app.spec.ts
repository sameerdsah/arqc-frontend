import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Title } from '@angular/platform-browser';
import { App } from './app';

// Expected buttons on each network page (same order as NETWORK_CONFIG in app.ts)
const EXPECTED: Record<string, { heading: string; buttons: string[] }> = {
  discover: { heading: 'Discover', buttons: ['ARQC', 'ARPC', 'TC', 'AAC', 'CVV', 'CID', 'iCVV', 'DCVV'] },
  mastercard: { heading: 'Mastercard', buttons: ['ARQC', 'ARPC', 'TC', 'AAC', 'CVC1', 'CVC2', 'Chip CVC', 'CVC3'] },
  visa: { heading: 'Visa', buttons: ['ARQC', 'ARPC', 'TC', 'AAC', 'CVV', 'CVV2', 'iCVV', 'dCVV'] },
  amex: { heading: 'American Express', buttons: ['ARQC', 'ARPC', 'CSC', 'CID', 'Chip CSC', 'Dynamic CSC'] }
};

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        // Every address is accepted by the router; App itself decides what to show
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    el = fixture.nativeElement as HTMLElement;
    await go('/');
  });

  async function go(url: string) {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function buttonLabels(): string[] {
    return Array.from(el.querySelectorAll('.network-options .network-btn')).map(b => (b.textContent ?? '').trim());
  }

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the four card networks on the start page', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Select Card Network');
    expect(buttonLabels()).toEqual(['Discover', 'Mastercard', 'Visa', 'American Express']);
  });

  for (const [network, expected] of Object.entries(EXPECTED)) {
    it(`shows the ${expected.heading} options with that network's names`, async () => {
      await go(`/${network}`);
      expect(el.querySelector('h2')?.textContent?.trim()).toBe(expected.heading);
      expect(buttonLabels()).toEqual(expected.buttons);
    });
  }

  it('opens a network page when its button is clicked', async () => {
    const mastercard = Array.from(el.querySelectorAll<HTMLButtonElement>('.network-btn'))
      .find(b => b.textContent?.trim() === 'Mastercard')!;
    mastercard.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/mastercard');
  });

  it('shows the working calculators for Discover ARQC, ARPC, CVV, CID and iCVV', async () => {
    await go('/discover/arqc');
    expect(el.querySelector('app-arqc-generator')).toBeTruthy();

    await go('/discover/arpc');
    expect(el.querySelector('app-arpc-generator')).toBeTruthy();

    await go('/discover/cid');
    expect(el.querySelector('app-cid-generator')).toBeTruthy();

    await go('/discover/cvv');
    expect(el.querySelector('app-cvv-generator')).toBeTruthy();

    await go('/discover/icvv');
    expect(el.querySelector('app-icvv-generator')).toBeTruthy();
  });

  it('keeps the Discover DCVV page', async () => {
    await go('/discover/dcvv');
    expect(el.querySelector('app-dcvv-generator')).toBeTruthy();
  });

  // Each network has its own folder of pages; [address, page element, title, working?]
  const NETWORK_PAGES: [string, string, string, boolean][] = [
    ['/visa/arqc', 'app-visa-arqc-generator', 'ARQC Generator', true],
    ['/visa/arpc', 'app-visa-arpc-generator', 'ARPC Generator', true],
    ['/visa/tc', 'app-visa-tc-generator', 'TC Generator', true],
    ['/visa/aac', 'app-visa-aac-generator', 'AAC Generator', true],
    ['/discover/tc', 'app-discover-tc-generator', 'TC Generator', true],
    ['/discover/aac', 'app-discover-aac-generator', 'AAC Generator', true],
    ['/mastercard/tc', 'app-mastercard-tc-generator', 'TC Generator', true],
    ['/mastercard/aac', 'app-mastercard-aac-generator', 'AAC Generator', true],
    ['/visa/cvv', 'app-visa-cvv-generator', 'CVV Generator', true],
    ['/visa/cvv2', 'app-visa-cvv2-generator', 'CVV2 Generator', true],
    ['/visa/icvv', 'app-visa-icvv-generator', 'iCVV Generator', true],
    ['/visa/dcvv', 'app-visa-dcvv-generator', 'dCVV Generator', false],
    ['/mastercard/arqc', 'app-mastercard-arqc-generator', 'ARQC Generator', true],
    ['/mastercard/arpc', 'app-mastercard-arpc-generator', 'ARPC Generator', true],
    ['/mastercard/cvc1', 'app-mastercard-cvc1-generator', 'CVC1 Generator', true],
    ['/mastercard/cvc2', 'app-mastercard-cvc2-generator', 'CVC2 Generator', true],
    ['/mastercard/chip-cvc', 'app-mastercard-chip-cvc-generator', 'Chip CVC Generator', true],
    ['/mastercard/cvc3', 'app-mastercard-cvc3-generator', 'CVC3 Generator', false],
    ['/amex/arqc', 'app-amex-arqc-generator', 'ARQC Generator', false],
    ['/amex/arpc', 'app-amex-arpc-generator', 'ARPC Generator', true],
    ['/amex/csc', 'app-amex-csc-generator', 'CSC Generator', false],
    ['/amex/cid', 'app-amex-cid-generator', 'CID Generator', false],
    ['/amex/chip-csc', 'app-amex-chip-csc-generator', 'Chip CSC Generator', false],
    ['/amex/dynamic-csc', 'app-amex-dynamic-csc-generator', 'Dynamic CSC Generator', false]
  ];

  for (const [url, selector, title, working] of NETWORK_PAGES) {
    it(`opens the ${title} page at ${url}`, async () => {
      await go(url);
      const page = el.querySelector(selector);
      expect(page).toBeTruthy();
      expect(page?.textContent).toContain(title);
      expect(!!page?.querySelector('form')).toBe(working);
      expect(!!page?.querySelector('.maintenance-text')).toBe(!working);
    });
  }

  it('does not show a Discover page under another network', async () => {
    await go('/visa/arqc');
    expect(el.querySelector('app-arqc-generator')).toBeNull();

    await go('/mastercard/cvc2');
    expect(el.querySelector('app-cid-generator')).toBeNull();

    await go('/amex/cid');
    expect(el.querySelector('app-cid-generator')).toBeNull();
    expect(el.querySelector('app-amex-cid-generator')).toBeTruthy();
  });

  it('sends unknown addresses back to the start page', async () => {
    await go('/mastercard/cvv'); // Mastercard uses CVC1, not CVV
    expect(router.url).toBe('/');

    await go('/abc');
    expect(router.url).toBe('/');

    await go('/discover/arqc/extra');
    expect(router.url).toBe('/');
  });

  it('shows the API Docs link to the documentation on every page', async () => {
    for (const url of ['/', '/visa', '/mastercard/cvc2']) {
      await go(url);
      const link = el.querySelector('app-api-docs-link a') as HTMLAnchorElement;
      expect(link?.getAttribute('href')).toBe('/api/docs');
    }
  });

  it('shows the header on every page, with the current network highlighted', async () => {
    for (const url of ['/', '/visa', '/visa/arqc', '/tools/verify']) {
      await go(url);
      const labels = Array.from(el.querySelectorAll('app-header .links a')).map(a => a.textContent?.trim());
      expect(labels).toEqual(['Discover', 'Mastercard', 'Visa', 'Amex', 'Verify', 'Batch']);
      expect(el.querySelector('app-header .brand')?.getAttribute('href')).toBe('/');
    }
    expect(el.querySelector('app-header .links a.active')?.textContent?.trim()).toBe('Verify');
    await go('/mastercard/cvc2');
    expect(el.querySelector('app-header .links a.active')?.textContent?.trim()).toBe('Mastercard');
  });

  it('goes home and to a network straight from the header', async () => {
    await go('/visa/arqc');
    (el.querySelector('app-header .brand') as HTMLAnchorElement).click();
    await fixture.whenStable();
    expect(router.url).toBe('/');
    await go('/visa/arqc');
    (Array.from(el.querySelectorAll<HTMLAnchorElement>('app-header .links a')).find(a => a.textContent?.trim() === 'Amex'))!.click();
    await fixture.whenStable();
    expect(router.url).toBe('/amex');
  });

  it('shows a breadcrumb and switches between the values of a network in one click', async () => {
    await go('/');
    expect(el.querySelector('app-page-nav')).toBeNull();
    await go('/visa/arqc');
    const crumbs = Array.from(el.querySelectorAll('app-page-nav .crumbs li')).map(li => li.textContent?.trim());
    expect(crumbs).toEqual(['Home', 'Visa', 'ARQC']);
    const arpc = Array.from(el.querySelectorAll<HTMLAnchorElement>('app-page-nav .chip')).find(a => a.textContent?.trim() === 'ARPC')!;
    arpc.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/visa/arpc');
    expect(el.querySelector('app-visa-arpc-generator')).toBeTruthy();
  });

  it('names the browser tab after the page', async () => {
    await go('/visa/arqc');
    expect(TestBed.inject(Title).getTitle()).toBe('Visa ARQC · Cryptogram Generator');
  });

  it('shows the testing tools on the start page and opens them by address', async () => {
    expect(el.querySelector('app-testing-tools-menu')).toBeTruthy();
    expect(buttonLabels()).toEqual(['Discover', 'Mastercard', 'Visa', 'American Express']);  // tools are separate

    await go('/tools/verify');
    expect(el.querySelector('app-verify-value')).toBeTruthy();
    expect(el.querySelector('app-testing-tools-menu')).toBeNull();

    await go('/tools/batch');
    expect(el.querySelector('app-batch-generation')).toBeTruthy();

    await go('/tools/unknown');
    expect(router.url).toBe('/');
  });
});
