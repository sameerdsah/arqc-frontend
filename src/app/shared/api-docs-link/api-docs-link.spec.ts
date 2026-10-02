import { TestBed } from '@angular/core/testing';
import { ApiDocsLink, isDesktopApp } from './api-docs-link';

describe('ApiDocsLink', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ApiDocsLink] }).compileComponents();
  });

  it('links to the API documentation in a new tab', () => {
    const fixture = TestBed.createComponent(ApiDocsLink);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.textContent).toContain('API Docs');
    expect(link.getAttribute('href')).toBe('/api/docs');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
  });

  it('is hidden in the desktop app', () => {
    const fixture = TestBed.createComponent(ApiDocsLink);
    fixture.componentInstance.visible = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('recognises the desktop app from the browser user agent', () => {
    expect(isDesktopApp('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/128.0 Electron/32.1.0 Safari/537.36')).toBe(true);
    expect(isDesktopApp('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/128.0 Safari/537.36')).toBe(false);
  });
});
