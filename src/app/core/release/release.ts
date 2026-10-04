import { MONTHS } from '../recent/recent-checks';

/**
 * Which release is running, for the footer: GET /api/health answers with the API version and the
 * edition and build set at deploy time (Jenkins). Pure helpers, tested without a browser.
 */

export interface Health {
  status: string;
  service: string;
  version: string;
  edition?: 'v1' | 'v2';
  build?: string;
  deployed?: string;          // '2026-10-04T09:30Z' (UTC)
}

export type ServiceState =
  | { state: 'checking' }
  | { state: 'up'; health: Health }
  | { state: 'down' };

/** The other edition, offered for side-by-side comparison: from v1, the next edition (v2). */
export const OTHER_EDITION = {
  label: 'Next edition (v2)',
  url: 'https://emv-crypto-v2.duckdns.org',
  title: 'The next edition: new home page, paste chip data from any card - for side-by-side comparison'
};

/** 'Service online' / 'Service offline' / 'Checking service…' - about the calculation service only, not which values are available. */
export function statusText(status: ServiceState): string {
  switch (status.state) {
    case 'up':
      return status.health.status === 'ok' ? 'Service online' : 'Service degraded';
    case 'down':
      return 'Service offline: values cannot be calculated right now';
    default:
      return 'Checking service…';
  }
}

/** What the status line means, for its tooltip. */
export const STATUS_HINT = 'The calculation service is responding. Values marked "awaits scheme specification" are not '
  + 'available yet.';

/** 'Version 1.0.0 · build 12'. The deployment time stays in /api/health for support; the footer leaves it out. */
export function releaseText(health: Health): string {
  const parts = [`Version ${health.version}`];
  if (health.build && health.build !== 'dev') {
    parts.push(`build ${health.build}`);
  }
  return parts.join(' · ');
}

/** '2026-10-04T09:30Z' -> '4 Oct 2026, 09:30 UTC'; null when missing or not in that form. */
export function formatDeployed(value: string | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})Z$/.exec(value ?? '');
  if (!m) {
    return null;
  }
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month} ${m[1]}, ${m[4]}:${m[5]} UTC` : null;
}
