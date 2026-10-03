import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PageNav } from './page-nav';

describe('PageNav', () => {
  it('shows the breadcrumb with the current page last, and the value switcher', async () => {
    await TestBed.configureTestingModule({ imports: [PageNav], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(PageNav);
    fixture.componentRef.setInput('crumbs', [{ label: 'Home', url: '/', active: false },
                                             { label: 'Visa', url: '/visa', active: false },
                                             { label: 'ARQC', url: '/visa/arqc', active: true }]);
    fixture.componentRef.setInput('switcher', [{ label: 'ARQC', url: '/visa/arqc', active: true },
                                               { label: 'ARPC', url: '/visa/arpc', active: false }]);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = Array.from(el.querySelectorAll('.crumbs a')).map(a => [a.textContent?.trim(), a.getAttribute('href')]);
    expect(links).toEqual([['Home', '/'], ['Visa', '/visa']]);
    expect(el.querySelector('.crumbs [aria-current="page"]')?.textContent?.trim()).toBe('ARQC');
    const chips = Array.from(el.querySelectorAll('.chip'));
    expect(chips.map(c => c.getAttribute('href'))).toEqual(['/visa/arqc', '/visa/arpc']);
    expect(chips[0].classList.contains('active')).toBe(true);
    expect(chips[0].getAttribute('aria-current')).toBe('page');
  });
});
