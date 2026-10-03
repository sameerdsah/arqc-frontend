import { Component } from '@angular/core';

/** True inside the Electron desktop app (offline: the Swagger page needs the internet to load). */
export function isDesktopApp(userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  return /\bElectron\//.test(userAgent);
}

/** Small "API Docs" link, at the right of the header on every page. Opens the Swagger documentation in a new tab.
 *  Hidden in the desktop app, where the documentation page cannot load offline. */
@Component({
  selector: 'app-api-docs-link',
  templateUrl: './api-docs-link.html',
  styleUrl: './api-docs-link.css'
})
export class ApiDocsLink {
  readonly docsUrl = '/api/docs';
  visible = !isDesktopApp();
}
