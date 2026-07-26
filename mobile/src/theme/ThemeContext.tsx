import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { apiFetch } from "@/lib/apiClient";
import { ThemeColors, ThemeName, themes } from "./tokens";

interface ThemeCtx {
  themeName: ThemeName;
  colors: ThemeColors;
  setThemeName: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  themeName: "sage",
  colors: themes.sage,
  setThemeName: () => {},
});

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "theme";

// Legacy theme names web used to sync from before the current 4-theme set;
// mirrors migrateTheme() in web/src/components/ThemeProvider.tsx.
function migrateTheme(saved: string): ThemeName {
  const map: Record<string, ThemeName> = { stone: "sage", blossom: "plum" };
  return (map[saved] ?? saved) as ThemeName;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>("sage");

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      const saved = migrateTheme(raw ?? "sage");
      if (!cancelled) setThemeNameState(saved);

      apiFetch("/user/settings")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data?.theme) return;
          const serverTheme = migrateTheme(data.theme);
          if (serverTheme !== saved) {
            setThemeNameState(serverTheme);
            AsyncStorage.setItem(STORAGE_KEY, serverTheme).catch(() => {});
          }
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeName = useCallback((t: ThemeName) => {
    setThemeNameState(t);
    AsyncStorage.setItem(STORAGE_KEY, t).catch(() => {});
    apiFetch("/user/settings", {
      method: "PATCH",
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ themeName, colors: themes[themeName], setThemeName }),
    [themeName, setThemeName]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
