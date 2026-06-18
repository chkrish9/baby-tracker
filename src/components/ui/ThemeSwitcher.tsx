"use client";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: "stone",   label: "Stone",   color: "#a89b8c" },
  { id: "sage",    label: "Sage",    color: "#87a878" },
  { id: "ocean",   label: "Ocean",   color: "#7aaed4" },
  { id: "blossom", label: "Blossom", color: "#f9a8d4" },
];

interface ThemeSwitcherProps {
  showLabels?: boolean;
  className?: string;
}

export function ThemeSwitcher({ showLabels, className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          onClick={() => setTheme(t.id)}
          className={cn(
            "rounded-full transition-all focus:outline-none",
            showLabels ? "flex flex-col items-center gap-1.5" : ""
          )}
        >
          <span
            className={cn(
              "block rounded-full border-2 transition-all",
              theme === t.id
                ? "border-foreground/40 ring-2 ring-offset-2 ring-foreground/20 scale-110"
                : "border-transparent hover:scale-105"
            )}
            style={{ width: 28, height: 28, background: t.color }}
          />
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
