"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type Theme = "stone" | "sage" | "ocean" | "blossom";

const THEME_COLORS: Record<Theme, string> = {
  stone:   "#a89b8c",
  sage:    "#87a878",
  ocean:   "#7aaed4",
  blossom: "#f9a8d4",
};

interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: "stone", setTheme: () => {} });

export function useTheme() { return useContext(ThemeContext); }

function applyTheme(theme: Theme) {
  if (theme === "stone") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  // Update PWA theme-color meta tag
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[theme];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("stone");

  // Apply localStorage theme immediately on mount (prevents flash)
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) ?? "stone";
    setThemeState(saved);
    applyTheme(saved);

    // Sync with server
    fetch("/api/user/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.theme && data.theme !== saved) {
          const serverTheme = data.theme as Theme;
          setThemeState(serverTheme);
          applyTheme(serverTheme);
          localStorage.setItem("theme", serverTheme);
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
