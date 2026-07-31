import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function babyDisplayName(baby: { name?: string | null; firstName?: string | null; lastName?: string | null; nickname?: string | null }): string {
  const nickname = baby.nickname?.trim();
  if (nickname) return nickname;
  const fullName = [baby.firstName, baby.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  return baby.name?.trim() ?? "";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
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

export function toHoursAndMinutes(totalMinutes: number | null | undefined): { hours: number; minutes: number } {
  if (!totalMinutes) return { hours: 0, minutes: 0 };
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function toTotalMinutes(hours: string, minutes: string): number | null {
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  const total = h * 60 + m;
  return total > 0 ? total : null;
}

export function formatMinutes(totalMinutes: number): string {
  const min = Math.round(totalMinutes);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
