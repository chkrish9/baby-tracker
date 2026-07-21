"use client";
import { use, useRef } from "react";
import Link from "next/link";
import { mutate } from "swr";
import useSWR from "swr";
import { useBaby } from "@/hooks/useBaby";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

interface FeedingLog { id: string; type: string; amount?: number | null; notes?: string | null; loggedAt: string; }
interface DiaperLog { id: string; type: string; notes?: string | null; loggedAt: string; }

export default function BabyProfilePage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: baby, isLoading } = useBaby(babyId);
  const { data: feedings } = useSWR(`/api/babies/${babyId}/feeding`, fetcher);
  const { data: diapers } = useSWR(`/api/babies/${babyId}/diapers`, fetcher);
  const { data: allBabies } = useSWR("/api/babies", fetcher);
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append("profilePhoto", files[0]);
    const res = await fetch(`/api/babies/${babyId}`, { method: "PATCH", body: formData });
    if (res.ok) { await mutate(`/api/babies/${babyId}`); await mutate("/api/babies"); toast("Photo updated!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!baby) return null;

  const photoSrc = baby.profilePhoto ? `/api/files/${baby.profilePhoto}` : undefined;

  const lastFeeding: FeedingLog | undefined = feedings?.[0];
  const today = new Date().toDateString();
  const diapersToday = diapers?.filter((d: DiaperLog) => new Date(d.loggedAt).toDateString() === today).length ?? 0;
  const lastDiaper: DiaperLog | undefined = diapers?.[0];

  // Combined recent events (last 4)
  const allEvents: Array<{ id: string; kind: "feeding" | "diaper"; type: string; notes?: string | null; loggedAt: string }> = [
    ...(feedings?.map((f: FeedingLog) => ({ ...f, kind: "feeding" as const })) ?? []),
    ...(diapers?.map((d: DiaperLog) => ({ ...d, kind: "diaper" as const })) ?? []),
  ].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()).slice(0, 4);

  const babiesCount = allBabies?.length ?? 1;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Baby header */}
      <div className="flex items-center gap-3">
        <div className="relative cursor-pointer" onClick={() => photoInputRef.current?.click()}>
          <Avatar src={photoSrc} name={baby.name} size={60} />
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 border border-pink-100/60 shadow-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 1.5C3.5 1.5 1.5 3.5 1.5 6S3.5 10.5 6 10.5 10.5 8.5 10.5 6 8.5 1.5 6 1.5z" /><circle cx="6" cy="6" r="2" />
            </svg>
          </div>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
        <div>
          <Link href="/dashboard" className="flex items-center gap-1.5 group">
            <h1 className="text-2xl font-bold text-foreground font-serif">{baby.name}</h1>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-foreground/40 group-hover:text-foreground/60 transition-colors mt-0.5">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-sm text-foreground/50">{ageLabel(baby.birthDate)}{babiesCount > 1 ? ` · ${babiesCount} babies` : ""}</p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/babies/${babyId}/feeding`}>
          <button className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl py-3 font-medium text-sm transition-colors">
            <BottleIcon className="text-white" />
            Log feed
          </button>
        </Link>
        <Link href={`/babies/${babyId}/diapers`}>
          <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-pink-50 text-foreground border border-pink-100/60 rounded-2xl py-3 font-medium text-sm transition-colors">
            <DiaperIcon />
            Log diaper
          </button>
        </Link>
      </div>

      {/* Today at a glance */}
      {allEvents.length > 0 && (
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

      {/* Doctor visit card */}
      <Link href={`/babies/${babyId}/doctor-visit`}>
        <div className="flex items-center gap-3 bg-pink-500 rounded-2xl p-4 text-white cursor-pointer hover:bg-pink-600 transition-colors">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2v5M4 9H2M16 9h-2M5.6 5.6l-1.4-1.4M13.8 13.8l-1.4-1.4" />
              <circle cx="9" cy="9" r="3" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Prepare doctor visit</p>
            <p className="text-xs text-white/70">View flagged items & documents</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4l6 5-6 5" />
          </svg>
        </div>
      </Link>

      {/* Parents & invites card */}
      <Link href={`/babies/${babyId}/invite`}>
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 p-4 cursor-pointer hover:bg-pink-50 transition-colors">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-pink-50 text-pink-400 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6.5" cy="6" r="2.5" />
              <path d="M2 15c0-2.5 2-4 4.5-4S11 12.5 11 15" />
              <path d="M12.5 8a2 2 0 100-4M15.5 15c0-2-1.5-3.3-3.5-3.8" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">Parents & invites</p>
            <p className="text-xs text-foreground/50">View co-parents or invite one</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
            <path d="M6 4l6 5-6 5" />
          </svg>
        </div>
      </Link>
    </div>
  );
}
