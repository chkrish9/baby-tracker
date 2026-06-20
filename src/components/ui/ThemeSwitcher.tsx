"use client";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: "sage",  label: "Sage",  color: "#4A6741" },
  { id: "clay",  label: "Clay",  color: "#7D5240" },
  { id: "ocean", label: "Ocean", color: "#3F7299" },
  { id: "plum",  label: "Plum",  color: "#6B50A0" },
];

interface ThemeSwitcherProps {
  showLabels?: boolean;
  className?: string;
}

export function ThemeSwitcher({ showLabels, className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          onClick={() => setTheme(t.id)}
          className={cn("transition-all focus:outline-none", showLabels ? "flex flex-col items-center gap-1.5" : "")}
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-2xl transition-all",
              theme === t.id ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "hover:scale-105"
            )}
            style={{ width: 52, height: 52, background: t.color }}
          >
            {theme === t.id && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4.5 4.5L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {showLabels && (
            <span className={cn("text-xs", theme === t.id ? "font-semibold text-foreground" : "text-foreground/50")}>
              {t.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
