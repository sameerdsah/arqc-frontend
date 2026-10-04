import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LearnPage } from './learn-page';
import { GUIDES } from '../learn-guides';

describe('LearnPage', () => {
  async function render(slug: string | null) {
    await TestBed.configureTestingModule({ imports: [LearnPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(LearnPage);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists every guide on /learn', async () => {
    const el = await render(null);
    const cards = Array.from(el.querySelectorAll('.card'));
    expect(cards.length).toBe(GUIDES.length);
    expect(cards[0].getAttribute('href')).toBe('/learn/what-is-a-cryptogram');
    expect(el.querySelector('h1')?.textContent).toContain('essentials');
  });

  it('shows a guide with its sections, Try it links and the next guide', async () => {
    const el = await render('arqc-arpc-round-trip');
    expect(el.querySelector('h1')?.textContent).toBe('ARQC and ARPC: the round trip');
    expect(el.querySelectorAll('section h2').length).toBe(4);
    const tryIt = Array.from(el.querySelectorAll('.try a')).map(a => a.getAttribute('href'));
    expect(tryIt).toEqual(['/mastercard/arqc', '/mastercard/arpc']);
    expect(el.querySelector('.next')?.getAttribute('href')).toBe('/learn/how-a-transaction-ends');
  });

  it('keeps the query string of a check link, so the example runs when opened', async () => {
    const el = await render('why-values-do-not-match');
    const href = el.querySelector('.try a')?.getAttribute('href') ?? '';
    expect(href.startsWith('/visa/arqc?')).toBe(true);
    expect(href).toContain('received=673A05ED91892AF8');
  });

  it('shows the tag table on the reference page, and no next link on the last guide', async () => {
    const el = await render('emv-tags');
    expect(el.querySelectorAll('tbody tr').length).toBe(GUIDES.at(-1)!.tags!.length);
    expect(el.querySelector('tbody th')?.textContent).toBe('9F02');
    expect(el.querySelector('.next')).toBeNull();
  });
});
