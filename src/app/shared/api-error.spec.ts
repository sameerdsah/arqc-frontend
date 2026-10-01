import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { friendlyErrorMessage, GENERIC_MESSAGE, SERVER_ERROR_MESSAGE, UNREACHABLE_MESSAGE } from './api-error';

function httpError(status: number, error: any = null, headers: Record<string, string> = {}) {
  return new HttpErrorResponse({ status, error, headers: new HttpHeaders(headers), url: '/api/cvv' });
}

describe('friendlyErrorMessage', () => {
  it('asks the user to wait the Retry-After seconds when rate limited (429)', () => {
    const err = httpError(429, { error: 'Rate limit exceeded: 120 requests per minute. Retry after 12 seconds.' },
                          { 'Retry-After': '12' });
    expect(friendlyErrorMessage(err)).toBe('Too many requests – please wait 12 seconds and try again.');
  });

  it('uses 30 seconds when a 429 has no Retry-After header', () => {
    expect(friendlyErrorMessage(httpError(429))).toBe('Too many requests – please wait 30 seconds and try again.');
  });

  it('shows a generic message with a short reference for server errors (500)', () => {
    const err = httpError(500, { error: 'Traceback: secret detail' }, { 'X-Request-ID': '9400e216ea5f4ef095a2d0981730ef02' });
    const message = friendlyErrorMessage(err);
    expect(message).toBe(`${SERVER_ERROR_MESSAGE} Reference: 9400e216`);
    expect(message).not.toContain('Traceback');
  });

  it('shows the generic server message without a reference when there is no request ID', () => {
    expect(friendlyErrorMessage(httpError(500, '<html>Internal Server Error</html>'))).toBe(SERVER_ERROR_MESSAGE);
  });

  it('ignores a malformed request ID', () => {
    const err = httpError(500, null, { 'X-Request-ID': '<script>x</script>' });
    expect(friendlyErrorMessage(err)).toBe(SERVER_ERROR_MESSAGE);
  });

  it('reports the service as unreachable when there is no connection (status 0)', () => {
    expect(friendlyErrorMessage(httpError(0))).toBe(UNREACHABLE_MESSAGE);
  });

  it('reports the service as unreachable for gateway errors (502, 503, 504)', () => {
    for (const status of [502, 503, 504]) {
      expect(friendlyErrorMessage(httpError(status, '<html>Bad Gateway</html>'))).toBe(UNREACHABLE_MESSAGE);
    }
  });

  it('keeps the backend validation message for 400', () => {
    expect(friendlyErrorMessage(httpError(400, { error: 'Missing required field(s): expiry' })))
      .toBe('Missing required field(s): expiry');
  });

  it('keeps the backend message for 501 (not available yet)', () => {
    expect(friendlyErrorMessage(httpError(501, { error: 'DCVV is in progress and not available yet' })))
      .toBe('DCVV is in progress and not available yet');
  });

  it('falls back to a generic message when a 4xx body has no usable message', () => {
    expect(friendlyErrorMessage(httpError(404, '<html>Not Found</html>'))).toBe(GENERIC_MESSAGE);
    expect(friendlyErrorMessage(httpError(400, { error: 'x'.repeat(500) }))).toBe(GENERIC_MESSAGE);
  });
});
