// ============================================================================
// Auth utilities — DPC Dashboard
// Shared token management and 401 handling.
// ============================================================================

const TOKEN_KEY = 'dpc_demo_token';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Force logout: clear the stored token and reload to show the login page.
 */
export function forceLogout(): void {
  clearToken();
  window.location.reload();
}

/**
 * Build Authorization headers using the stored token.
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken() ?? '';
  return { Authorization: `Bearer ${token}`, ...extra };
}

/**
 * Check a fetch Response for 401 and force logout if unauthorized.
 * Returns the response for chaining.
 */
export function handleUnauthorized(res: Response): Response {
  if (res.status === 401) {
    forceLogout();
  }
  return res;
}
