const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

if (!API_URL && typeof window !== "undefined") {
  console.error("NEXT_PUBLIC_API_URL is not set — API calls will fail.");
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// Every call site in this app was written against the old same-origin Next.js
// API routes and still uses paths like "/api/babies". Rather than rewrite
// every call site's URL, this resolves against the new API origin and strips
// the now-redundant "/api" prefix, so existing path strings keep working.
function resolveUrl(path: string): string {
  const withoutApiPrefix = path.startsWith("/api/") ? path.slice(4) : path;
  return `${API_URL}${withoutApiPrefix}`;
}

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(resolveUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": getCookie("csrf_token") ?? "" },
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * fetch()-compatible wrapper: resolves relative same-origin-style paths
 * against the API's own origin, always sends cookies cross-origin, attaches
 * the CSRF header on mutating requests, and transparently refreshes an
 * expired access token once before returning a still-401 response. It does
 * NOT redirect on auth failure — callers that require a session decide what
 * to do with a 401 (this function is also used by background/public calls
 * like the theme sync on the login page, where redirecting would be wrong).
 */
export async function apiFetch(path: string, init: RequestInit = {}, _retried = false): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (MUTATING_METHODS.has(method)) {
    const csrf = getCookie("csrf_token");
    if (csrf) headers.set("X-CSRF-Token", csrf);
    if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(resolveUrl(path), { ...init, headers, credentials: "include" });

  if (res.status === 401 && !_retried && !path.includes("/auth/refresh") && !path.includes("/auth/login")) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, init, true);
  }

  return res;
}

export function filesUrl(relativePath: string): string {
  return resolveUrl(`/api/files/${relativePath}`);
}

const LOGGED_IN_MARKER = "logged_in";

function setLoggedInMarker(rememberMe: boolean) {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30 days, or session-only
  document.cookie = `${LOGGED_IN_MARKER}=1; path=/${maxAge ? `; max-age=${maxAge}` : ""}`;
}

function clearLoggedInMarker() {
  document.cookie = `${LOGGED_IN_MARKER}=; path=/; max-age=0`;
}

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export async function login(email: string, password: string, rememberMe: boolean): Promise<{ user: AuthUser } | { error: string }> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.error ?? "Invalid email or password" };
  }
  setLoggedInMarker(rememberMe);
  return res.json();
}

export async function register(email: string, password: string, name: string | undefined): Promise<{ ok: true } | { error: string }> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: data.error ?? "Registration failed" };
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  clearLoggedInMarker();
}
