import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavLink } from '../../navigation/navigation';
import { ApiDocsLink } from '../api-docs-link/api-docs-link';

/**
 * Header on every page: the app name (home), the four networks, the testing tools, Learn and API Docs.
 * Real links, so they work with the keyboard and open in a new tab with Ctrl+click.
 * Presentational: the links and the active section come from the site map (navigation.ts).
 * The "Test keys" badge reminds everyone, on every page, that this is a test tool.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, ApiDocsLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeader {
  readonly networks = input.required<NavLink[]>();
  readonly tools = input.required<NavLink[]>();
  readonly learn = input<NavLink | null>(null);
  readonly homeActive = input(false);
}
