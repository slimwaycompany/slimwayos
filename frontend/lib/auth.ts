const TOKEN_KEY  = 'slimway_token';
const USER_KEY   = 'slimway_user';
const AUTH_COOKIE = 'slimway_auth';

export const API =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api/v1';

export interface AuthUser {
  id?: string;
  email?: string;
  is_developer: boolean;
  must_change_password: boolean;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(accessToken: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Session-presence cookie for Next.js middleware (not HttpOnly so JS can clear it)
  document.cookie = `${AUTH_COOKIE}=1; path=/; SameSite=Strict; max-age=86400`;
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function callLogoutApi(): Promise<void> {
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch {
    // best-effort: clear session client-side regardless
  }
}
