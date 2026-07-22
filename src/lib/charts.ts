import { ML_PER_OZ, formatOz, formatMl, formatMinutes } from "@/lib/utils";
import type { ChartDay, ChartSeries } from "@/components/charts/WeeklyStackedBarChart";

export const FEED_SERIES: ChartSeries[] = [
  { key: "BOTTLE", label: "Bottle", color: "#2a78d6" },
  { key: "BREAST_LEFT", label: "Breast (L)", color: "#eb6834" },
  { key: "BREAST_RIGHT", label: "Breast (R)", color: "#1baf7a" },
  { key: "SOLID", label: "Solid", color: "#eda100" },
];

export const DIAPER_SERIES: ChartSeries[] = [
  { key: "WET", label: "Wet", color: "#2a78d6" },
  { key: "DIRTY", label: "Dirty", color: "#eb6834" },
  { key: "BOTH", label: "Mixed", color: "#1baf7a" },
  { key: "DRY", label: "Dry", color: "#eda100" },
];

export type ChartRange = "today" | "yesterday" | "7d" | "30d";

export const RANGE_OPTIONS: { value: ChartRange; label: string; phrase: string }[] = [
  { value: "today", label: "Today", phrase: "today" },
  { value: "yesterday", label: "Yesterday", phrase: "yesterday" },
  { value: "7d", label: "Last 7 days", phrase: "in the last 7 days" },
  { value: "30d", label: "Last 30 days", phrase: "in the last 30 days" },
];

export function daysForRange(range: ChartRange): Date[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "today") return [start];
  if (range === "yesterday") return [new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1)];
  const length = range === "30d" ? 30 : 7;
  return Array.from({ length }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() - (length - 1 - i)));
}

export function bucketByDay<T extends { type: string; loggedAt: string }>(
  logs: T[],
  days: Date[],
  extraFn?: (acc: Record<string, number>, log: T) => void
): ChartDay[] {
  return days.map((date) => {
    const counts: Record<string, number> = {};
    const extra: Record<string, number> = {};
    for (const log of logs) {
      const logDate = new Date(log.loggedAt);
      if (logDate.toDateString() === date.toDateString()) {
        counts[log.type] = (counts[log.type] ?? 0) + 1;
        extraFn?.(extra, log);
      }
    }
    return { date, counts, extra: extraFn ? extra : undefined };
  });
}

export interface FeedingLogLike { type: string; amount?: number | null; duration?: number | null; unit?: string | null; loggedAt: string }

export function feedingExtra(acc: Record<string, number>, log: FeedingLogLike) {
  if (log.type === "BOTTLE" && log.amount != null) {
    const ml = log.unit === "oz" ? log.amount * ML_PER_OZ : log.amount;
    acc.bottleMl = (acc.bottleMl ?? 0) + ml;
  } else if (log.type === "BREAST_LEFT" && log.duration != null) {
    acc.breastLeftMin = (acc.breastLeftMin ?? 0) + (log.unit === "hr" ? log.duration * 60 : log.duration);
  } else if (log.type === "BREAST_RIGHT" && log.duration != null) {
    acc.breastRightMin = (acc.breastRightMin ?? 0) + (log.unit === "hr" ? log.duration * 60 : log.duration);
  }
}

export function feedTooltipExtraLines(day: ChartDay) {
  const bottleMl = day.extra?.bottleMl ?? 0;
  const lMin = day.extra?.breastLeftMin ?? 0;
  const rMin = day.extra?.breastRightMin ?? 0;
  const lines: { label: string; value: string; color?: string }[] = [];
  if (bottleMl > 0) lines.push({ label: "Bottle total", value: `${formatOz(bottleMl)} (${formatMl(bottleMl)})`, color: "#2a78d6" });
  if (lMin > 0) lines.push({ label: "Breast (L) total", value: formatMinutes(lMin), color: "#eb6834" });
  if (rMin > 0) lines.push({ label: "Breast (R) total", value: formatMinutes(rMin), color: "#1baf7a" });
  if (lMin + rMin > 0) lines.push({ label: "Breast total (L+R)", value: formatMinutes(lMin + rMin) });
  return lines;
}

export const FEED_EXTRA_COLUMNS = [
  { key: "bottle", label: "Bottle", format: (d: ChartDay) => (d.extra?.bottleMl ?? 0) > 0 ? `${formatOz(d.extra!.bottleMl)} / ${formatMl(d.extra!.bottleMl)}` : "–" },
  { key: "breastL", label: "Breast L", format: (d: ChartDay) => (d.extra?.breastLeftMin ?? 0) > 0 ? formatMinutes(d.extra!.breastLeftMin) : "–" },
  { key: "breastR", label: "Breast R", format: (d: ChartDay) => (d.extra?.breastRightMin ?? 0) > 0 ? formatMinutes(d.extra!.breastRightMin) : "–" },
  {
    key: "breastTotal",
    label: "Breast L+R",
    format: (d: ChartDay) => {
      const t = (d.extra?.breastLeftMin ?? 0) + (d.extra?.breastRightMin ?? 0);
      return t > 0 ? formatMinutes(t) : "–";
    },
  },
];

export interface GrowthPoint {
  date: Date;
  value: number;
}

export function toGrowthPoints(records: { recordedAt: string; value: number }[]): GrowthPoint[] {
  return [...records]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map((r) => ({ date: new Date(r.recordedAt), value: r.value }));
}
