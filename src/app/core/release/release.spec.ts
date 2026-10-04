import { formatDeployed, releaseText, statusText } from './release';

describe('release information (footer)', () => {
  it('describes the service state', () => {
    expect(statusText({ state: 'checking' })).toBe('Checking service…');
    expect(statusText({ state: 'up', health: { status: 'ok', service: 'emv-crypto-api', version: '1.0.0' } }))
      .toBe('Service online');
    expect(statusText({ state: 'down' })).toContain('Service offline');
  });

  it('names the running release, leaving out what is unknown', () => {
    const base = { status: 'ok', service: 'emv-crypto-api', version: '1.0.0' };
    expect(releaseText(base)).toBe('Version 1.0.0');
    expect(releaseText({ ...base, build: 'dev' })).toBe('Version 1.0.0');
    expect(releaseText({ ...base, build: '12', deployed: '2026-10-04T09:30Z' }))
      .toBe('Version 1.0.0 · build 12');                         // no deployment time in the footer
  });

  it('formats only well-formed deployment times', () => {
    expect(formatDeployed('2026-01-09T23:05Z')).toBe('9 Jan 2026, 23:05 UTC');
    expect(formatDeployed('2026-13-09T23:05Z')).toBeNull();
    expect(formatDeployed('soon')).toBeNull();
    expect(formatDeployed(undefined)).toBeNull();
  });
});
