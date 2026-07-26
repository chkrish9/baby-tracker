import { TextStyle } from "react-native";

// RN needs the exact font-file name per weight (unlike web's variable-font
// `font-weight` CSS property), so Lora weights are separate family names.
export const fontFamily = {
  sans: "Geist", // falls back to system sans if @expo-google-fonts/geist isn't loaded
  serifRegular: "Lora_400Regular",
  serifMedium: "Lora_500Medium",
  serifSemiBold: "Lora_600SemiBold",
  serifBold: "Lora_700Bold",
};

// Tailwind's default type scale (font-size/line-height), used verbatim by
// the web app's text-* utility classes.
export const fontSize = {
  xs: { size: 12, lineHeight: 16 },
  sm: { size: 14, lineHeight: 20 },
  base: { size: 16, lineHeight: 24 },
  lg: { size: 18, lineHeight: 28 },
  xl: { size: 20, lineHeight: 28 },
  "2xl": { size: 24, lineHeight: 32 },
  "3xl": { size: 30, lineHeight: 36 },
};

// Preset text styles for the specific serif headings used across the app.
export const textStyles: Record<string, TextStyle> = {
  // Login/register "Little Notes" wordmark — text-3xl font-bold font-serif
  wordmark: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize["3xl"].size,
    lineHeight: fontSize["3xl"].lineHeight,
    fontWeight: "700",
  },
  // Baby profile name header — text-2xl font-bold font-serif
  babyName: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize["2xl"].size,
    lineHeight: fontSize["2xl"].lineHeight,
    fontWeight: "700",
  },
  // "Trends" / "Today at a glance" section titles — text-lg font-bold font-serif
  sectionTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize.lg.size,
    lineHeight: fontSize.lg.lineHeight,
    fontWeight: "700",
  },
  // Modal sheet title — text-xl font-semibold font-serif
  modalTitle: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: fontSize.xl.size,
    lineHeight: fontSize.xl.lineHeight,
    fontWeight: "600",
  },
  // PageHeader h1 — text-2xl font-bold font-serif
  pageTitle: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize["2xl"].size,
    lineHeight: fontSize["2xl"].lineHeight,
    fontWeight: "700",
  },
};
