import { TestBed } from '@angular/core/testing';
import { RecentChecksPanel, checkLabel } from './recent-checks-panel';
import { RecentChecks } from '../../core/recent/recent-checks.service';

describe('RecentChecksPanel', () => {
  async function setup() {
    try { localStorage.clear(); } catch { /* storage unavailable */ }
    await TestBed.configureTestingModule({ imports: [RecentChecksPanel] }).compileComponents();
    const fixture = TestBed.createComponent(RecentChecksPanel);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, recent: TestBed.inject(RecentChecks) };
  }

  it('names values from the site map', () => {
    expect(checkLabel('/visa/arqc')).toBe('Visa ARQC');
    expect(checkLabel('/mastercard/tc')).toBe('Mastercard TC');
    expect(checkLabel('/nowhere/x')).toBe('/nowhere/x');
  });

  it('lists recent checks with a link that runs them again, and clears them', async () => {
    const { fixture, el, recent } = await setup();
    expect(el.querySelector('.empty')).toBeTruthy();
    recent.record({ path: '/visa/arqc', valueName: 'ARQC', received: '673A05ED91892AF8', outcome: 'mismatch',
                    cause: 'Transaction counter (9F36)', link: '/visa/arqc?tag_9f36=0001&received=673A05ED91892AF8',
                    at: new Date().toISOString() });
    fixture.detectChanges();
    const item = el.querySelector('.item') as HTMLAnchorElement;
    expect(item.getAttribute('href')).toBe('/visa/arqc?tag_9f36=0001&received=673A05ED91892AF8');
    expect(item.querySelector('.label')?.textContent).toBe('Visa ARQC');
    expect(item.querySelector('.outcome')?.textContent).toBe('No match · Transaction counter (9F36)');
    (el.querySelector('.clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.item')).toBeNull();
  });
});
