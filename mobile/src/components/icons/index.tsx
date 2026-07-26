// Central icon library — every icon here is a direct, mechanical port of an
// inline <svg> from the web app (same viewBox/paths/strokeWidth), just using
// react-native-svg primitives instead of DOM <svg>/<path>. No redesign.
import { Circle, Path, Rect, Svg } from "react-native-svg";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// ── Bottom tab bar (web/src/components/layout/BottomNav.tsx) ──────────────

export function DashboardIcon({ size = 22, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Rect x="2" y="2" width="8" height="8" rx="2" />
      <Rect x="12" y="2" width="8" height="8" rx="2" />
      <Rect x="2" y="12" width="8" height="8" rx="2" />
      <Rect x="12" y="12" width="8" height="8" rx="2" />
    </Svg>
  );
}

export function HomeIcon({ size = 22, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 10.5L11 3l8 7.5" />
      <Path d="M5 9v9a1 1 0 001 1h10a1 1 0 001-1V9" />
      <Path d="M8.5 19v-5.5a1 1 0 011-1h3a1 1 0 011 1V19" />
    </Svg>
  );
}

export function LogsIcon({ size = 22, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Rect x="4" y="2" width="14" height="18" rx="2.5" />
      <Path d="M8 7h6M8 11h6M8 15h4" strokeLinecap="round" />
    </Svg>
  );
}

export function PhotosIcon({ size = 22, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Rect x="2" y="5" width="18" height="14" rx="2.5" />
      <Path d="M6 5V4a2 2 0 012-2h6a2 2 0 012 2v1" />
      <Circle cx="11" cy="12" r="2.5" />
      <Path d="M7 18l1.5-2a2.5 2.5 0 014 0L14 18" strokeLinecap="round" />
    </Svg>
  );
}

export function HealthIcon({ size = 22, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M11 4l6.5 6.5c1.8 1.8 1.8 4.7 0 6.5s-4.7 1.8-6.5 0L11 17l0 0-6.5-6.5c-1.8-1.8-1.8-4.7 0-6.5s4.7-1.8 6.5 0z" />
      <Path d="M8 11h2l1-2 2 4 1-2h2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 22, color = "currentColor", strokeWidth = 1.6 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
      <Circle cx="11" cy="11" r="6" />
      <Circle cx="11" cy="11" r="2.2" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(45 11 11)" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(90 11 11)" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(135 11 11)" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(180 11 11)" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(225 11 11)" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(270 11 11)" />
      <Rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(315 11 11)" />
    </Svg>
  );
}

// ── Chrome: PageHeader back button, Navbar dropdown ────────────────────────

export function BackChevronIcon({ size = 16, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 12L6 8l4-4" />
    </Svg>
  );
}

export function SwitchBabyIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M2 6l6-4 6 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function AddBabyIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 3v10M3 8h10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function NavSettingsIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth={1.5} />
      <Path
        d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.2 3.2l.7.7M12.1 12.1l.7.7M12.8 3.2l-.7.7M3.9 12.1l-.7.7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SignOutIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M10 8H3M7 5l-3 3 3 3M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Baby profile (web/src/app/(app)/babies/[babyId]/page.tsx) ─────────────

export function BottleIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 2h6M7 2v2.5C5.5 5.5 4 7 4 9.5v5a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0014 14.5v-5C14 7 12.5 5.5 11 4.5V2" />
    </Svg>
  );
}

export function DiaperIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 6h14v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      <Path d="M2 6c2 0 4 2 7 2s5-2 7-2" />
    </Svg>
  );
}

export function CameraIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 4l-1.2 2H3a1.5 1.5 0 00-1.5 1.5v7A1.5 1.5 0 003 16h12a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0015 6h-1.8L12 4H6z" />
      <Circle cx="9" cy="10" r="2.5" />
    </Svg>
  );
}

// Large variant used in photos/page.tsx's empty state.
export function CameraLargeIcon({ size = 32, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 6l-2 3H6a2 2 0 00-2 2v13a2 2 0 002 2h20a2 2 0 002-2V11a2 2 0 00-2-2h-4l-2-3h-8z" />
      <Circle cx="16" cy="17" r="4" />
    </Svg>
  );
}

export function ClockIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="9" r="7" />
      <Path d="M9 5v4l3 2" />
    </Svg>
  );
}

export function ScaleIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="9" cy="9" r="7" />
      <Path d="M9 5v4l2.5 2.5" />
    </Svg>
  );
}

export function RulerIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="5" width="14" height="8" rx="1.5" />
      <Path d="M5 5v2.5M8 5v2.5M11 5v2.5M14 5v2.5" />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

// ── Shared list-row actions (logs/health/doctor-visit/dashboard) ──────────

export function EditIcon({ size = 16, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11.5 2.5a1.5 1.5 0 012.12 2.12l-7.5 7.5-3 .88.88-3 7.5-7.5z" />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 4h10M6 4V2.5h4V4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
    </Svg>
  );
}

export function FlagIcon({ size = 16, color = "currentColor", strokeWidth = 1.5, filled }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={filled ? color : "none"} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 2v12" />
      <Path d="M4 2.5h7l-1.5 2.5L11 7.5H4" />
    </Svg>
  );
}

export function ChevronIcon({
  size = 16,
  color = "currentColor",
  strokeWidth = 1.8,
  direction = "right",
}: IconProps & { direction?: "left" | "right" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={direction === "left" ? "M10 12L6 8l4-4" : "M6 4l4 4-4 4"} />
    </Svg>
  );
}

export function CalendarIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="3" width="14" height="13" rx="2" />
      <Path d="M2 7h14M6 1.5v3M12 1.5v3" />
    </Svg>
  );
}

// ── Health screen (web/src/app/(app)/babies/[babyId]/health/page.tsx) ─────

export function VaccineIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 2l5 5-2 2-1-1-2 2 1.5 1.5-2 2L9 12l-2 2-3.5-3.5 2-2L7 10l2-2-1.5-1.5 2-2 1 1 2-2z" />
      <Path d="M2 16l2.5-2.5" />
    </Svg>
  );
}

export function NoteIcon({ size = 18, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="2" width="12" height="14" rx="1.5" />
      <Path d="M6 6h6M6 9h6M6 12h3" />
    </Svg>
  );
}

// ── Photos screen (web/src/app/(app)/babies/[babyId]/photos/page.tsx) ─────

export function CloseIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Path d="M5 5l10 10M15 5L5 15" />
    </Svg>
  );
}

// Larger chevron used in the photo lightbox (distinct viewBox/size from ChevronIcon above).
export function LightboxChevronIcon({
  size = 22,
  color = "currentColor",
  strokeWidth = 2,
  direction,
}: IconProps & { direction: "left" | "right" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={direction === "left" ? "M12.5 4l-6 6 6 6" : "M7.5 4l6 6-6 6"} />
    </Svg>
  );
}

// ── Settings screen (web/src/app/(app)/settings/page.tsx) ─────────────────

export function EyeIcon({ size = 16, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <Circle cx="8" cy="8" r="2" />
    </Svg>
  );
}

export function EyeOffIcon({ size = 16, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 2l12 12M6.7 6.7A2 2 0 0010 10M9.4 9.4A2 2 0 016 8c0-.4.1-.8.3-1.1M4.2 4.2C2.4 5.3 1 8 1 8s2.5 5 7 5c1.5 0 2.9-.5 4-1.2M12.5 12.5C14 11.4 15 8 15 8s-2.5-5-7-5c-.9 0-1.8.2-2.6.5" />
    </Svg>
  );
}

// ── Baby profile extras (doctor-visit CTA banner, avatar edit overlay) ────

export function StethoscopeIcon({ size = 18, color = "#fff", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 2v4a4 4 0 008 0V2" />
      <Path d="M9 10v2.5" />
      <Circle cx="9" cy="14.5" r="2" />
    </Svg>
  );
}

export function BannerChevronIcon({ size = 18, color = "#fff", strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 4l6 5-6 5" />
    </Svg>
  );
}

export function AvatarCameraDotIcon({ size = 12, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <Path d="M6 1.5C3.5 1.5 1.5 3.5 1.5 6S3.5 10.5 6 10.5 10.5 8.5 10.5 6 8.5 1.5 6 1.5z" />
      <Circle cx="6" cy="6" r="2" />
    </Svg>
  );
}

// ── Theme swatch checkmark (web/src/components/ui/ThemeSwitcher.tsx) ──────

export function CheckIcon({ size = 20, color = "#fff", strokeWidth = 2.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M4 10l4.5 4.5L16 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
