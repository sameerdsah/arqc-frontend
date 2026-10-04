import { Injectable, signal } from '@angular/core';
import { addRecent, readRecent, RECENT_STORAGE_KEY, RecentCheck } from './recent-checks';

/**
 * Keeps the recent checks in this browser only (localStorage): nothing is sent anywhere.
 * Storage can be missing or blocked (private window, desktop app settings); the list then simply
 * lives for this visit, and the app never fails because of it.
 */
@Injectable({ providedIn: 'root' })
export class RecentChecks {
  private readonly list = signal<RecentCheck[]>(readRecent(this.load()));
  readonly checks = this.list.asReadonly();

  record(check: RecentCheck) {
    this.list.update(list => addRecent(list, check));
    this.save();
  }

  clear() {
    this.list.set([]);
    this.save();
  }

  private load(): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(RECENT_STORAGE_KEY) : null;
    } catch {
      return null;
    }
  }

  private save() {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(this.list()));
    } catch {
      // storage unavailable or full: keep the list in memory only
    }
  }
}
