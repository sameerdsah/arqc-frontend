import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { findGuide, GUIDES, LEARN_URL } from '../learn-guides';

/**
 * /learn (all guides) and /learn/<guide> (one guide). Presentational: the content lives in
 * learn-guides.ts; the guide to show comes from the address (navigation.ts).
 */
@Component({
  selector: 'app-learn-page',
  imports: [RouterLink],
  templateUrl: './learn-page.html',
  styleUrl: './learn-page.css'
})
export class LearnPage {
  /** Guide slug from the address, or null for the list of guides. */
  readonly slug = input<string | null>(null);

  readonly guides = GUIDES;
  readonly learnUrl = LEARN_URL;
  readonly guide = computed(() => findGuide(this.slug()));
  /** The next guide, so a reader can go through them in order. */
  readonly next = computed(() => {
    const i = GUIDES.findIndex(g => g.slug === this.slug());
    return i >= 0 && i < GUIDES.length - 1 ? GUIDES[i + 1] : null;
  });

  /** In-app links use the router; links with a query string (check links) too. */
  path(url: string): string {
    return url.split('?')[0];
  }

  query(url: string): Record<string, string> | null {
    const q = url.split('?')[1];
    return q ? Object.fromEntries(new URLSearchParams(q)) : null;
  }
}
