import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

// Expected buttons on each network page (same order as NETWORK_CONFIG in app.ts)
const EXPECTED: Record<string, { heading: string; buttons: string[] }> = {
  discover: { heading: 'Discover', buttons: ['ARQC', 'ARPC', 'CVV', 'CID', 'iCVV', 'DCVV'] },
  mastercard: { heading: 'Mastercard', buttons: ['ARQC', 'ARPC', 'CVC1', 'CVC2', 'Chip CVC', 'CVC3'] },
  visa: { heading: 'Visa', buttons: ['ARQC', 'ARPC', 'CVV', 'CVV2', 'iCVV', 'dCVV'] },
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

  it('shows "Under Maintenance" with the full name for options that are not live yet', async () => {
    await go('/mastercard/cvc2');
    expect(el.querySelector('app-arqc-generator')).toBeNull();
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('CVC2');
    expect(el.textContent).toContain('Card Validation Code 2 (printed on the card)');
    expect(el.querySelector('.maintenance-text')?.textContent).toContain('Under Maintenance');
  });

  it('does not show a Discover calculator under another network', async () => {
    await go('/visa/arqc');
    expect(el.querySelector('app-arqc-generator')).toBeNull();

    await go('/amex/cid');
    expect(el.querySelector('app-cid-generator')).toBeNull();
    expect(el.querySelector('.maintenance-text')).toBeTruthy();
  });

  it('sends unknown addresses back to the start page', async () => {
    await go('/mastercard/cvv'); // Mastercard uses CVC1, not CVV
    expect(router.url).toBe('/');

    await go('/abc');
    expect(router.url).toBe('/');

    await go('/discover/arqc/extra');
    expect(router.url).toBe('/');
  });
});
