"use client";
import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import useSWR from "swr";
import { useBaby } from "@/hooks/useBaby";
import { useGrowthRecords } from "@/hooks/useHealth";
import { useBabyPermissions } from "@/hooks/usePermissions";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { WeeklyStackedBarChart } from "@/components/charts/WeeklyStackedBarChart";
import { apiFetch, filesUrl } from "@/lib/api-client";
import { GrowthLineChart } from "@/components/charts/GrowthLineChart";
import {
  FEED_SERIES, DIAPER_SERIES, RANGE_OPTIONS, daysForRange, bucketByDay,
  feedingExtra, feedTooltipExtraLines, FEED_EXTRA_COLUMNS, toGrowthPoints, type ChartRange,
} from "@/lib/charts";
import { formatOz, formatMl, formatMinutes } from "@/lib/utils";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

function ageLabel(birthDate: string) {
  const birth = new Date(birthDate);
  const days = Math.floor((Date.now() - birth.getTime()) / 86400000);
  if (days < 7) return `${days}d old`;
  if (days < 30) return `${Math.floor(days / 7)}w old`;
  const months = Math.floor(days / 30.44);
  if (months < 24) {
    const wks = Math.floor((days - Math.floor(months * 30.44)) / 7);
    return wks > 0 ? `${months} mo ${wks}w old` : `${months} mo old`;
  }
  return `${Math.floor(months / 12)}y old`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const FEEDING_LABELS: Record<string, string> = {
  BREAST_LEFT: "Breast (L)", BREAST_RIGHT: "Breast (R)", BOTTLE: "Bottle", SOLID: "Solid"
};

const DIAPER_LABELS: Record<string, string> = {
  WET: "Wet diaper", DIRTY: "Dirty diaper", BOTH: "Mixed diaper", DRY: "Dry diaper"
};

function BottleIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2h6M7 2v2.5C5.5 5.5 4 7 4 9.5v5a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0014 14.5v-5C14 7 12.5 5.5 11 4.5V2" />
    </svg>
  );
}

function DiaperIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 6h14v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      <path d="M2 6c2 0 4 2 7 2s5-2 7-2" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 4l-1.2 2H3a1.5 1.5 0 00-1.5 1.5v7A1.5 1.5 0 003 16h12a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0015 6h-1.8L12 4H6z" />
      <circle cx="9" cy="10" r="2.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5v4l3 2" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5v4l2.5 2.5" />
    </svg>
  );
}

function RulerIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="5" width="14" height="8" rx="1.5" />
      <path d="M5 5v2.5M8 5v2.5M11 5v2.5M14 5v2.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

interface FeedingLog { id: string; type: string; amount?: number | null; duration?: number | null; unit?: string | null; notes?: string | null; loggedAt: string; }
interface DiaperLog { id: string; type: string; notes?: string | null; loggedAt: string; }

export default function BabyProfilePage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: baby, isLoading } = useBaby(babyId);
  const { hasSection } = useBabyPermissions(babyId);
  const canLogs = hasSection("LOGS");
  const canHealth = hasSection("HEALTH");
  const canDoctorVisits = hasSection("DOCTOR_VISITS");
  const canPhotos = hasSection("PHOTOS");
  const { data: feedings } = useSWR(canLogs ? `/api/babies/${babyId}/feeding` : null, fetcher);
  const { data: diapers } = useSWR(canLogs ? `/api/babies/${babyId}/diapers` : null, fetcher);
  const { data: weightRecords } = useGrowthRecords(canHealth ? babyId : "", "WEIGHT");
  const { data: heightRecords } = useGrowthRecords(canHealth ? babyId : "", "HEIGHT");
  const { data: allBabies } = useSWR("/api/babies", fetcher);
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryPhotoInputRef = useRef<HTMLInputElement>(null);

  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const chartDays = useMemo(() => daysForRange(chartRange), [chartRange]);
  const feedChartData = useMemo(() => bucketByDay(feedings ?? [], chartDays, feedingExtra), [feedings, chartDays]);
  const diaperChartData = useMemo(() => bucketByDay(diapers ?? [], chartDays), [diapers, chartDays]);
  const weightPoints = useMemo(() => toGrowthPoints(weightRecords ?? []), [weightRecords]);
  const heightPoints = useMemo(() => toGrowthPoints(heightRecords ?? []), [heightRecords]);
  const chartRangeOption = RANGE_OPTIONS.find((o) => o.value === chartRange) ?? RANGE_OPTIONS[2];
  const chartRangeLabel = chartRangeOption.label;
  const chartRangePhrase = chartRangeOption.phrase;

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append("profilePhoto", files[0]);
    const res = await apiFetch(`/api/babies/${babyId}`, { method: "PATCH", body: formData });
    if (res.ok) { await mutate(`/api/babies/${babyId}`); await mutate("/api/babies"); toast("Photo updated!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  async function handleGalleryPhotoUpload(files: FileList | null) {
    if (!files?.length) return;
    setShowQuickAdd(false);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    const res = await apiFetch(`/api/babies/${babyId}/photos`, { method: "POST", body: formData });
    if (res.ok) { await mutate(`/api/babies/${babyId}/photos`); toast("Photo uploaded!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!baby) return null;

  const photoSrc = baby.profilePhoto ? filesUrl(baby.profilePhoto) : undefined;

  const lastFeeding: FeedingLog | undefined = feedings?.[0];
  const today = new Date().toDateString();
  const diapersToday = diapers?.filter((d: DiaperLog) => new Date(d.loggedAt).toDateString() === today).length ?? 0;
  const lastDiaper: DiaperLog | undefined = diapers?.[0];

  const latestWeight = weightRecords?.[0];
  const latestHeight = heightRecords?.[0];

  const feedingsToday: FeedingLog[] = feedings?.filter((f: FeedingLog) => new Date(f.loggedAt).toDateString() === today) ?? [];
  const feedTotalsToday: Record<string, number> = {};
  feedingsToday.forEach((f) => feedingExtra(feedTotalsToday, f));
  const bottleMlToday = feedTotalsToday.bottleMl ?? 0;
  const breastMinToday = (feedTotalsToday.breastLeftMin ?? 0) + (feedTotalsToday.breastRightMin ?? 0);

  // Combined recent events (last 4)
  const allEvents: Array<{ id: string; kind: "feeding" | "diaper"; type: string; notes?: string | null; loggedAt: string }> = [
    ...(feedings?.map((f: FeedingLog) => ({ ...f, kind: "feeding" as const })) ?? []),
    ...(diapers?.map((d: DiaperLog) => ({ ...d, kind: "diaper" as const })) ?? []),
  ].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()).slice(0, 4);

  const babiesCount = allBabies?.length ?? 1;
  const fullName = [baby.firstName, baby.lastName].filter(Boolean).join(" ") || baby.name;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Baby header */}
      <div className="flex items-center gap-3">
        <div className="relative cursor-pointer" onClick={() => photoInputRef.current?.click()}>
          <Avatar src={photoSrc} name={fullName} size={60} />
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 border border-pink-100/60 shadow-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 1.5C3.5 1.5 1.5 3.5 1.5 6S3.5 10.5 6 10.5 10.5 8.5 10.5 6 8.5 1.5 6 1.5z" /><circle cx="6" cy="6" r="2" />
            </svg>
          </div>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
        <div>
          <Link href="/dashboard" className="flex items-center gap-1.5 group">
            <h1 className="text-2xl font-bold text-foreground font-serif">{fullName}</h1>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-foreground/40 group-hover:text-foreground/60 transition-colors mt-0.5">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-sm text-foreground/50">{ageLabel(baby.birthDate)}{babiesCount > 1 ? ` · ${babiesCount} babies` : ""}</p>
        </div>
      </div>

      {/* Stats */}
      {canLogs && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <BottleIcon />
              Last feed
            </div>
            {lastFeeding ? (
              <>
                <p className="text-xl font-bold text-foreground">{timeAgo(lastFeeding.loggedAt)}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{FEEDING_LABELS[lastFeeding.type] ?? lastFeeding.type}{lastFeeding.notes ? ` · ${lastFeeding.notes}` : ""}</p>
              </>
            ) : (
              <p className="text-sm text-foreground/40">No feeds yet</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <DiaperIcon />
              Diapers today
            </div>
            <p className="text-xl font-bold text-foreground">{diapersToday}</p>
            {lastDiaper && <p className="text-xs text-foreground/50 mt-0.5">Last {timeAgo(lastDiaper.loggedAt)}</p>}
          </div>
        </div>
      )}

      {/* Feed totals today */}
      {canLogs && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <BottleIcon />
              Total bottle feed today
            </div>
            <p className="text-xl font-bold text-foreground">
              {bottleMlToday > 0 ? `${formatOz(bottleMlToday)} / ${formatMl(bottleMlToday)}` : "–"}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <ClockIcon />
              Total breast time today
            </div>
            <p className="text-xl font-bold text-foreground">{breastMinToday > 0 ? formatMinutes(breastMinToday) : "–"}</p>
          </div>
        </div>
      )}

      {/* Growth stats */}
      {canHealth && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <ScaleIcon />
              Latest weight
            </div>
            {latestWeight ? (
              <>
                <p className="text-xl font-bold text-foreground">{latestWeight.value} {latestWeight.unit}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{timeAgo(latestWeight.recordedAt)}</p>
              </>
            ) : (
              <p className="text-sm text-foreground/40">No weight logged</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <RulerIcon />
              Latest height
            </div>
            {latestHeight ? (
              <>
                <p className="text-xl font-bold text-foreground">{latestHeight.value} {latestHeight.unit}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{timeAgo(latestHeight.recordedAt)}</p>
              </>
            ) : (
              <p className="text-sm text-foreground/40">No height logged</p>
            )}
          </div>
        </div>
      )}

      {/* Doctor visit card */}
      {canDoctorVisits && (
        <Link href={`/babies/${babyId}/doctor-visit`}>
          <div className="flex items-center gap-3 bg-pink-500 rounded-2xl p-4 text-white cursor-pointer hover:bg-pink-600 transition-colors">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2v4a4 4 0 008 0V2" />
                <path d="M9 10v2.5" />
                <circle cx="9" cy="14.5" r="2" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Prepare doctor visit</p>
              <p className="text-xs text-white/70">View flagged items & photos</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4l6 5-6 5" />
            </svg>
          </div>
        </Link>
      )}

      {/* Trends */}
      {(canLogs || canHealth) && (
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground font-serif">Trends</h2>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value as ChartRange)}
              className="flex-shrink-0 rounded-2xl border border-pink-100 bg-white pl-3 pr-7 py-1.5 text-sm text-foreground focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
              aria-label="Chart date range"
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {canLogs && (
            <>
              <WeeklyStackedBarChart
                title="Feedings"
                series={FEED_SERIES}
                data={feedChartData}
                rangeLabel={chartRangeLabel}
                emptyLabel={`No feedings logged ${chartRangePhrase}`}
                tooltipExtraLines={feedTooltipExtraLines}
                extraColumns={FEED_EXTRA_COLUMNS}
              />
              <WeeklyStackedBarChart
                title="Diapers"
                series={DIAPER_SERIES}
                data={diaperChartData}
                rangeLabel={chartRangeLabel}
                emptyLabel={`No diaper changes logged ${chartRangePhrase}`}
              />
            </>
          )}
          {canHealth && (
            <>
              <GrowthLineChart
                title="Weight"
                points={weightPoints}
                unit={latestWeight?.unit ?? "kg"}
                emptyLabel="No weight logged yet"
                color="#2a78d6"
              />
              <GrowthLineChart
                title="Height"
                points={heightPoints}
                unit={latestHeight?.unit ?? "cm"}
                emptyLabel="No height logged yet"
                color="#1baf7a"
              />
            </>
          )}
        </div>
      )}

      {/* Today at a glance */}
      {canLogs && allEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground font-serif">Today at a glance</h2>
            <Link href={`/babies/${babyId}/feeding`} className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors">View all</Link>
          </div>
          <div className="space-y-2">
            {allEvents.map((event) => (
              <div key={event.id + event.kind} className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${event.kind === "feeding" ? "bg-pink-50 text-pink-400" : "bg-amber-50 text-amber-500"}`}>
                  {event.kind === "feeding" ? <BottleIcon /> : <DiaperIcon />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {event.kind === "feeding" ? (FEEDING_LABELS[event.type] ?? event.type) : (DIAPER_LABELS[event.type] ?? event.type)}
                  </p>
                  {event.notes && <p className="text-xs text-foreground/50 truncate">{event.notes}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-foreground">{formatTime(event.loggedAt)}</p>
                  <p className="text-xs text-foreground/40">{timeAgo(event.loggedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input ref={galleryPhotoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryPhotoUpload(e.target.files)} />

      {(canLogs || canPhotos) && (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg flex items-center justify-center transition-colors"
          aria-label="Quick add"
        >
          <PlusIcon />
        </button>
      )}

      <Modal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Quick add">
        <div className="space-y-2 mt-2">
          {canLogs && (
            <>
              <Link href={`/babies/${babyId}/feeding`} onClick={() => setShowQuickAdd(false)}>
                <div className="flex items-center gap-3 bg-pink-50/50 hover:bg-pink-50 rounded-2xl p-3.5 cursor-pointer transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-pink-500 text-white flex-shrink-0">
                    <BottleIcon />
                  </div>
                  <p className="font-medium text-foreground text-sm">Log feed</p>
                </div>
              </Link>
              <Link href={`/babies/${babyId}/feeding?tab=diaper`} onClick={() => setShowQuickAdd(false)}>
                <div className="flex items-center gap-3 bg-pink-50/50 hover:bg-pink-50 rounded-2xl p-3.5 cursor-pointer transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 text-white flex-shrink-0">
                    <DiaperIcon />
                  </div>
                  <p className="font-medium text-foreground text-sm">Log diaper</p>
                </div>
              </Link>
            </>
          )}
          {canPhotos && (
            <button
              onClick={() => galleryPhotoInputRef.current?.click()}
              className="w-full flex items-center gap-3 bg-pink-50/50 hover:bg-pink-50 rounded-2xl p-3.5 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500 text-white flex-shrink-0">
                <CameraIcon />
              </div>
              <p className="font-medium text-foreground text-sm">Upload photo</p>
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
