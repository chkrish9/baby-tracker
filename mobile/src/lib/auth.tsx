import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import * as apiClient from "./apiClient";
import { setUnauthorizedHandler } from "./apiClient";
import { clearTokens, getRefreshToken } from "./storage";

type AuthStatus = "loading" | "signedIn" | "signedOut";

interface AuthCtx {
  status: AuthStatus;
  user: apiClient.AuthUser | null;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ ok: true } | { error: string }>;
  signUp: (email: string, password: string, name: string | undefined) => Promise<{ ok: true } | { error: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<apiClient.AuthUser | null>(null);

  const forceSignOut = useCallback(() => {
    clearTokens().catch(() => {});
    setUser(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(forceSignOut);
    return () => setUnauthorizedHandler(null);
  }, [forceSignOut]);

  useEffect(() => {
    getRefreshToken().then((token) => {
      setStatus(token ? "signedIn" : "signedOut");
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const result = await apiClient.login(email, password, rememberMe);
    if ("error" in result) return result;
    setUser(result.user);
    setStatus("signedIn");
    return { ok: true as const };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string | undefined) => {
    return apiClient.register(email, password, name);
  }, []);

  const signOut = useCallback(async () => {
    await apiClient.logout().catch(() => {});
    setUser(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(() => ({ status, user, signIn, signUp, signOut }), [status, user, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
