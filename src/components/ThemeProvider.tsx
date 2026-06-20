"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type Theme = "sage" | "clay" | "ocean" | "plum";

const THEME_COLORS: Record<Theme, string> = {
  sage:  "#4A6741",
  clay:  "#7D5240",
  ocean: "#3F7299",
  plum:  "#6B50A0",
};

interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: "sage", setTheme: () => {} });

export function useTheme() { return useContext(ThemeContext); }

function applyTheme(theme: Theme) {
  if (theme === "sage") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[theme];
}

function migrateTheme(saved: string): Theme {
  const map: Record<string, Theme> = { stone: "sage", blossom: "plum" };
  return (map[saved] ?? saved) as Theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("sage");

  useEffect(() => {
    const raw = localStorage.getItem("theme") ?? "sage";
    const saved = migrateTheme(raw);
    setThemeState(saved);
    applyTheme(saved);

    fetch("/api/user/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.theme) {
          const serverTheme = migrateTheme(data.theme);
          if (serverTheme !== saved) {
            setThemeState(serverTheme);
            applyTheme(serverTheme);
            localStorage.setItem("theme", serverTheme);
          }
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem("theme", t);
    fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
