import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppFooter } from './app-footer';

describe('AppFooter', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [AppFooter],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    const fixture = TestBed.createComponent(AppFooter);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
  }

  it('shows that the service is up, and which release is running', async () => {
    const { fixture, http, el } = await setup();
    expect(el.querySelector('.status')?.textContent).toContain('Checking');
    http.expectOne('/api/health').flush({ status: 'ok', service: 'emv-crypto-api', version: '1.0.0',
                                          edition: 'v2', build: '12', deployed: '2026-10-04T09:30Z' });
    fixture.detectChanges();
    expect(el.querySelector('.status')?.textContent).toContain('Service online');
    expect(el.querySelector('.status')?.getAttribute('title')).toContain('awaits scheme specification');
    expect(el.querySelector('.status')?.classList.contains('up')).toBe(true);
    expect(el.querySelector('.release')?.textContent).toBe('Version 1.0.0 · build 12');
    http.verify();
  });

  it('says so when the service cannot be reached', async () => {
    const { fixture, http, el } = await setup();
    http.expectOne('/api/health').flush('down', { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();
    expect(el.querySelector('.status')?.classList.contains('down')).toBe(true);
    expect(el.querySelector('.status')?.textContent).toContain('Service offline');
    expect(el.querySelector('.release')).toBeNull();
  });

  it('links to Learn, monitoring, the API documentation and the next edition', async () => {
    const { el, http } = await setup();
    http.expectOne('/api/health');
    const hrefs = Array.from(el.querySelectorAll('.links a')).map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/learn', '/api/dashboard', '/api/docs', 'https://emv-crypto-v2.duckdns.org']);
    expect(el.querySelector('.legal')?.textContent).toContain('Test data and test keys only');
  });
});
