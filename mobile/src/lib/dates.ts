// Ported verbatim from web/src/lib/utils.ts (numeric/date helpers only —
// `cn()` has no RN equivalent since styles are objects, not class strings).

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// `new Date("YYYY-MM-DD")` parses a date-only string as UTC midnight (per
// spec), not local midnight — round-tripping a locally-picked date through
// that constructor shifts it back a day in any timezone behind UTC. Picker
// `value` props must parse these "YYYY-MM-DD" strings back with the numeric
// constructor instead, which is local-time.
export function dateFromInput(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function babyDisplayName(baby: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
}): string {
  const nickname = baby.nickname?.trim();
  if (nickname) return nickname;
  const fullName = [baby.firstName, baby.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  return baby.name?.trim() ?? "";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

export const ML_PER_OZ = 29.5735; // standard US fluid ounce

export function formatOz(ml: number): string {
  return `${(ml / ML_PER_OZ).toFixed(1)} oz`;
}

export function formatMl(ml: number): string {
  return `${Math.round(ml)} ml`;
}

export function formatMinutes(totalMinutes: number): string {
  const min = Math.round(totalMinutes);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function nowDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTimeStr(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function combineDateTime(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
}

export function splitDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function timeAgo(iso: string): string {
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSec < 60) return "just now";
  const totalMin = Math.floor(diffSec / 60);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return `${parts.join(" ")} ago`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return "TODAY";
  if (d.toDateString() === yest) return "YESTERDAY";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function relativeDayLabel(iso: string): string {
  const target = new Date(iso);
  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((startTarget.getTime() - startOfToday().getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export function formatApptDate(iso: string, withWeekday: "short" | "long" = "short"): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: withWeekday,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ageLabel(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const weeks = Math.floor(days / 7);
  days = days % 7;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0 || parts.length === 0) parts.push(`${days}d`);

  return `${parts.join(" ")} old`;
}
