import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns a failed API call into a message that is safe and useful to show on the page.
 * - 429 (rate limit)            -> ask the user to wait (seconds from the Retry-After header)
 * - 500-type server errors      -> generic message + short reference (X-Request-ID) for the logs
 * - no connection / 502-504     -> service unreachable
 * - anything else (400, 404, 501) -> the backend's own validation message
 * Technical details of server errors are never shown to the user.
 */
export const UNREACHABLE_MESSAGE = 'The service is unreachable. Please try again shortly.';
export const SERVER_ERROR_MESSAGE = 'Something went wrong on our side.';
export const GENERIC_MESSAGE = 'The request could not be processed. Please check the values and try again.';
const DEFAULT_WAIT_SECONDS = 30;

export function friendlyErrorMessage(err: HttpErrorResponse | any): string {
  const status: number = typeof err?.status === 'number' ? err.status : 0;

  if (status === 429) {
    const seconds = Number(err?.headers?.get?.('Retry-After'));
    const wait = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : DEFAULT_WAIT_SECONDS;
    return `Too many requests – please wait ${wait} seconds and try again.`;
  }

  if (status === 0 || status === 502 || status === 503 || status === 504) {
    return UNREACHABLE_MESSAGE;
  }

  if (status >= 500 && status !== 501) {
    const ref = requestReference(err);
    return ref ? `${SERVER_ERROR_MESSAGE} Reference: ${ref}` : SERVER_ERROR_MESSAGE;
  }

  // 400 / 404 / 501: the backend sends a short, fixed, user-facing message
  const message = err?.error?.error;
  return typeof message === 'string' && message.length > 0 && message.length <= 200 ? message : GENERIC_MESSAGE;
}

/** First 8 characters of the request ID - enough to find the request in the server log. */
function requestReference(err: any): string {
  const id = err?.headers?.get?.('X-Request-ID') ?? err?.error?.request_id;
  return typeof id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(id) ? id.slice(0, 8) : '';
}
