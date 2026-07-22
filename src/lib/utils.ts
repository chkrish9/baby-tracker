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

export function babyDisplayName(baby: { firstName?: string | null; lastName?: string | null; nickname?: string | null }): string {
  const nickname = baby.nickname?.trim();
  if (nickname) return nickname;
  return [baby.firstName, baby.lastName].filter(Boolean).join(" ").trim();
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

export function formatMinutes(totalMinutes: number): string {
  const min = Math.round(totalMinutes);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
