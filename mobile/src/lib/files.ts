import { useCallback, useEffect, useState } from "react";
import { filesUrl } from "./apiClient";
import { getAccessToken } from "./storage";

// The API's /files/* route requires an authenticated request (no public
// URLs), so expo-image needs the Bearer header attached per-request via its
// `source.headers` prop. This hook keeps a live copy of the access token so
// call sites don't need an async SecureStore read on every render.
export function useAuthHeaders(): Record<string, string> {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAccessToken().then((t) => {
      if (!cancelled) setToken(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAuthedImageSource(relativePath: string | null | undefined) {
  const headers = useAuthHeaders();
  const getSource = useCallback(
    () => (relativePath ? { uri: filesUrl(relativePath), headers } : null),
    [relativePath, headers]
  );
  return getSource();
}

export { filesUrl };
