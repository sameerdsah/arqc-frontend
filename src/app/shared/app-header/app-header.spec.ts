import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  it('links home, to the networks and to the testing tools, marking the current section', async () => {
    await TestBed.configureTestingModule({ imports: [AppHeader], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('networks', [{ label: 'Visa', url: '/visa', active: true, title: 'Visa (VSDC / qVSDC)' },
                                               { label: 'Amex', url: '/amex', active: false }]);
    fixture.componentRef.setInput('tools', [{ label: 'Verify', url: '/tools/verify', active: false }]);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.brand')?.getAttribute('href')).toBe('/');
    const links = Array.from(el.querySelectorAll('.links a'));
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/visa', '/amex', '/tools/verify']);
    expect(links[0].classList.contains('active')).toBe(true);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].getAttribute('aria-current')).toBeNull();
    expect(el.querySelector('app-api-docs-link')).toBeTruthy();
  });

  it('shows Learn after the testing tools, and the test keys badge', async () => {
    await TestBed.configureTestingModule({ imports: [AppHeader], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('networks', [{ label: 'Visa', url: '/visa', active: false }]);
    fixture.componentRef.setInput('tools', [{ label: 'Verify', url: '/tools/verify', active: false }]);
    fixture.componentRef.setInput('learn', { label: 'Learn', url: '/learn', active: true });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = Array.from(el.querySelectorAll('.links a'));
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/visa', '/tools/verify', '/learn']);
    expect(links[2].getAttribute('aria-current')).toBe('page');
    expect(el.querySelector('.badge')?.textContent?.trim()).toBe('Test keys');
  });
});
