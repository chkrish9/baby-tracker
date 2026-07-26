// Transcribed verbatim from web/src/app/globals.css — do not hand-tweak these
// values without diffing against that file again.

export type ThemeName = "sage" | "clay" | "ocean" | "plum";

export interface ThemeColors {
  background: string;
  foreground: string;
  pink: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
  };
}

export const themes: Record<ThemeName, ThemeColors> = {
  sage: {
    background: "#EAE6DC",
    foreground: "#1C1C1A",
    pink: {
      50: "#F2F5F0",
      100: "#DDE4DA",
      200: "#C3D1BE",
      300: "#9DB896",
      400: "#718D69",
      500: "#4A6741",
      600: "#3D5835",
      700: "#2D4228",
      800: "#1E2D1B",
    },
  },
  clay: {
    background: "#EDE7E0",
    foreground: "#2A1F18",
    pink: {
      50: "#F5F0EB",
      100: "#E8D8CC",
      200: "#D4B9A7",
      300: "#B89484",
      400: "#9A7060",
      500: "#7D5240",
      600: "#6A3F2E",
      700: "#4D2E20",
      800: "#321D12",
    },
  },
  ocean: {
    background: "#E8EEF4",
    foreground: "#1A2C3D",
    pink: {
      50: "#EDF3F8",
      100: "#D3E2EF",
      200: "#AECCE4",
      300: "#84AFCF",
      400: "#5E90B5",
      500: "#3F7299",
      600: "#2F5D80",
      700: "#204462",
      800: "#132B42",
    },
  },
  plum: {
    background: "#EDE8F2",
    foreground: "#251A30",
    pink: {
      50: "#F3EFF8",
      100: "#E2D8EF",
      200: "#CBBCE0",
      300: "#AA96CB",
      400: "#8B72B6",
      500: "#6B50A0",
      600: "#573E87",
      700: "#3E2B64",
      800: "#271A42",
    },
  },
};

// Fixed accent colors — same across all 4 themes.
export const fixedColors = {
  mint: { 100: "#e1f7ee", 200: "#bdebd9", 300: "#8fdcc0" },
  butter: { 100: "#fff6dd", 200: "#ffe9a8" },
  sky: { 100: "#e6f3ff", 200: "#bfe3ff" },
  // Hardcoded, non-themed Tailwind neutrals used across the web app for
  // errors/danger/sign-out, "dirty" diaper + "other" health icon, "wet"
  // diaper + height icon + photo-upload FAB, and mint-badge/toast text.
  red: { 50: "#fef2f2", 100: "#fee2e2", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
  amber: { 50: "#fffbeb", 500: "#f59e0b" },
  sky500: "#0ea5e9",
  emerald: { 700: "#047857", 800: "#065f46" },
};

export const radii = { xl: 12, "2xl": 16, "3xl": 24, full: 9999 };

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
} as const;

// Chart series colors — fixed regardless of active theme (matches web).
export const chartColors = {
  growth: { weight: "#2a78d6", height: "#1baf7a" },
  feeding: { bottle: "#2a78d6", breastL: "#eb6834", breastR: "#1baf7a", solid: "#eda100" },
  diaper: { wet: "#2a78d6", dirty: "#eb6834", mixed: "#1baf7a", dry: "#eda100" },
};

// Avatar initials background palette — deterministic hash pick, matches web.
export const avatarPalette = ["#7090B5", "#B87860", "#6B8FA0", "#8B7BB5", "#4A6741", "#A07850"];
