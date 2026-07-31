import { clearTokens, getAccessToken, getRefreshToken, setAccessToken, setTokens } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

if (!API_URL) {
  console.error("EXPO_PUBLIC_API_URL is not set — API calls will fail.");
}

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

let refreshInFlight: Promise<boolean> | null = null;

// Registered by AuthProvider (src/lib/auth.tsx) so that a definitively failed
// refresh (refresh token itself expired/invalid) can force a sign-out and
// redirect to /login, without every call site needing to check for this.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

// Mirrors web/src/lib/api-client.ts's tryRefresh, but sends the refresh token
// in the body (mobile has no cookie jar) instead of relying on a cookie +
// CSRF header.
async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        await setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * fetch()-compatible wrapper mirroring web's apiFetch: attaches the stored
 * access token as a Bearer header, sets JSON content-type on mutating
 * requests (unless the body is FormData, for uploads), and transparently
 * refreshes an expired access token once before returning a still-401
 * response. Does NOT redirect on auth failure — callers decide.
 */
export async function apiFetch(path: string, init: RequestInit = {}, _retried = false): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  const accessToken = await getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  if (MUTATING_METHODS.has(method)) {
    if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login")) {
    if (!_retried) {
      const refreshed = await tryRefresh();
      if (refreshed) return apiFetch(path, init, true);
    }
    onUnauthorized?.();
  }

  return res;
}

export function filesUrl(relativePath: string): string {
  return `${API_URL}/files/${relativePath}`;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

export async function login(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<{ user: AuthUser } | { error: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });
  } catch {
    return { error: NETWORK_ERROR };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: data.error ?? "Invalid email or password" };
  }
  await setTokens(data.accessToken, data.refreshToken);
  return { user: data.user };
}

export async function register(
  email: string,
  password: string,
  name: string | undefined
): Promise<{ ok: true } | { error: string }> {
  let res: Response;
  try {
    res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  } catch {
    return { error: NETWORK_ERROR };
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.error ?? "Registration failed" };
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  await clearTokens();
}
