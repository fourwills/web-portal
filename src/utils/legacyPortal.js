import { apiBaseUrl } from '../config/api';

/** Classic DNL web portal (same host as API), for fallback billing when needed. */
export function getLegacyPortalUrl() {
  try {
    const origin = new URL(apiBaseUrl).origin;
    return `${origin}/`;
  } catch {
    return null;
  }
}
