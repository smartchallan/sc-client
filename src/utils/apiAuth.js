/**
 * Global auth interceptor (fetch).
 *
 * - Pulls the JWT from localStorage `sc_user.token` (set on login in App.jsx).
 * - Attaches `Authorization: Bearer <token>` to every fetch() that targets
 *   the SmartChallan API (VITE_API_BASE_URL or relative URLs).
 * - On 401 with a token-error code, clears storage and redirects to /login.
 *
 * Imported once from main.jsx — do not import elsewhere.
 */

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function getToken() {
  try {
    const raw = localStorage.getItem('sc_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

function isApiUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/')) return true;
  if (API_ROOT && url.startsWith(API_ROOT)) return true;
  if (url.includes('smartchallan.com') || url.includes('nigraani.com')) return true;
  return false;
}

function isAuthEndpoint(url) {
  return typeof url === 'string' && (url.includes('/auth/login') || url.includes('/auth/register'));
}

function handleUnauthorized() {
  try { localStorage.removeItem('sc_user'); } catch {}
  try { window.location.hash = '/login'; } catch { window.location.replace('/#/login'); }
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url;

  if (isApiUrl(url) && !isAuthEndpoint(url)) {
    const token = getToken();
    if (token) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
      const existing = headers.get('Authorization') || '';
      // Treat empty or "Bearer " (no token) as missing so we can inject the real one
      if (!existing.trim() || /^Bearer\s*$/i.test(existing.trim())) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init = { ...init, headers };
    }
  }

  const res = await originalFetch(input, init);
  if (res.status === 401 && !isAuthEndpoint(url)) {
    try {
      const cloned = res.clone();
      const body = await cloned.json().catch(() => null);
      const code = body && (body.error || body.code);
      if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN' || code === 'MISSING_TOKEN' ||
          (body && /Authorization/i.test(body.message || body.error || ''))) {
        handleUnauthorized();
      }
    } catch {}
  }
  return res;
};
