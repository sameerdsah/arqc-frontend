/**
 * "Recent checks" on the home page: the last received-value checks made in this browser.
 * Pure helpers (no Angular, no storage access), so the rules are tested without a browser.
 * Each entry keeps the check link, so one click reopens the page and runs the same check again.
 */

export interface RecentCheck {
  path: string;                 // page address, e.g. '/visa/arqc'
  valueName: string;            // e.g. 'ARQC'
  received: string;             // the value that was checked
  outcome: 'match' | 'mismatch';
  cause?: string;               // short title of the cause found, e.g. 'Transaction counter (9F36)'
  link: string;                 // relative check link: '/visa/arqc?tag_9f02=...&received=...'
  at: string;                   // ISO time of the check
}

export const RECENT_LIMIT = 5;
export const RECENT_STORAGE_KEY = 'cg.recentChecks.v1';

const PAGE_PATH = /^\/[a-z]+\/[a-z0-9-]+$/;

/** Newest first; the same check (same link) appears once; never more than RECENT_LIMIT entries. */
export function addRecent(list: RecentCheck[], check: RecentCheck): RecentCheck[] {
  return [check, ...list.filter(c => c.link !== check.link)].slice(0, RECENT_LIMIT);
}

/** A check link without the site address: '/visa/arqc?...' (works on any host, v1 or v2). */
export function relativeLink(link: string): string {
  return link.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '');
}

/**
 * Reads what was stored. Anything unexpected (old format, edited by hand, another app) is dropped,
 * so a bad entry can never break the home page or produce a link to another site.
 */
export function readRecent(raw: string | null): RecentCheck[] {
  if (!raw) {
    return [];
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(isRecentCheck).slice(0, RECENT_LIMIT);
}

function isRecentCheck(value: unknown): value is RecentCheck {
  const c = value as Partial<RecentCheck>;
  return !!c && typeof c === 'object'
    && typeof c.path === 'string' && PAGE_PATH.test(c.path)
    && typeof c.valueName === 'string' && c.valueName.length <= 20
    && typeof c.received === 'string' && /^[0-9A-F]{1,32}$/.test(c.received)
    && (c.outcome === 'match' || c.outcome === 'mismatch')
    && (c.cause === undefined || (typeof c.cause === 'string' && c.cause.length <= 80))
    && typeof c.link === 'string' && (c.link === c.path || c.link.startsWith(c.path + '?'))
    && typeof c.at === 'string' && !isNaN(Date.parse(c.at));
}

/** One line under the value: 'Match', 'No match · Transaction counter (9F36)' or 'No match'. */
export function outcomeText(check: RecentCheck): string {
  if (check.outcome === 'match') {
    return 'Match';
  }
  return check.cause ? `No match · ${check.cause}` : 'No match';
}

/** '2 min ago', '3 h ago', '4 Oct' - short, for the list. */
export function timeAgo(at: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(at)) / 60000));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  if (minutes < 24 * 60) {
    return `${Math.round(minutes / 60)} h ago`;
  }
  const date = new Date(at);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
