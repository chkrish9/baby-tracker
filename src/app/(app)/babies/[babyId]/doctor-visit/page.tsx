"use client";
import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useBaby } from "@/hooks/useBaby";
import { Spinner } from "@/components/ui/Spinner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FeedingLog { id: string; type: string; loggedAt: string; }
interface DiaperLog { id: string; type: string; notes?: string | null; loggedAt: string; }
interface Doc { id: string; path: string; originalName: string; mimeType: string; }

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6l-4-4z" />
      <path d="M9 2v4h4" />
    </svg>
  );
}

export default function DoctorVisitPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: baby, isLoading: babyLoading } = useBaby(babyId);
  const { data: feedings } = useSWR(`/api/babies/${babyId}/feeding`, fetcher);
  const { data: diapers } = useSWR(`/api/babies/${babyId}/diapers`, fetcher);
  const { data: docs } = useSWR(`/api/babies/${babyId}/documents`, fetcher);

  if (babyLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const feeds24h = feedings?.filter((f: FeedingLog) => new Date(f.loggedAt).getTime() > cutoff).length ?? 0;
  const diapers24h = diapers?.filter((d: DiaperLog) => new Date(d.loggedAt).getTime() > cutoff).length ?? 0;
  const flaggedItems = 0; // flagging feature not yet implemented

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link
          href={`/babies/${babyId}`}
          className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-pink-100/60 text-foreground hover:bg-pink-50 transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-foreground font-serif">Doctor visit</h1>
      </div>

      <p className="text-sm text-foreground/50 mb-5">
        Everything you flagged for {baby?.name ?? "your baby"}&apos;s next appointment, gathered in one place.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-pink-100/60 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{feeds24h}</p>
          <p className="text-xs text-foreground/40 mt-1">Feeds / 24h</p>
        </div>
        <div className="bg-white rounded-2xl border border-pink-100/60 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{diapers24h}</p>
          <p className="text-xs text-foreground/40 mt-1">Diapers / 24h</p>
        </div>
        <div className="bg-white rounded-2xl border border-pink-100/60 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{flaggedItems}</p>
          <p className="text-xs text-foreground/40 mt-1">Flagged items</p>
        </div>
      </div>

      {/* Flagged Photos */}
      <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-2">Flagged photos</p>
      <div className="bg-white rounded-2xl border border-pink-100/60 px-4 py-4 mb-5">
        <p className="text-sm text-foreground/40 text-center">
          No photos flagged yet. Tap the flag on any photo to add it here.
        </p>
      </div>

      {/* Flagged Diaper Notes */}
      <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-2">Flagged diaper notes</p>
      <div className="bg-white rounded-2xl border border-pink-100/60 px-4 py-4 mb-5">
        <p className="text-sm text-foreground/40 text-center">No flagged diaper notes.</p>
      </div>

      {/* Documents */}
      <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-2">Documents</p>
      {docs?.length ? (
        <div className="space-y-2">
          {docs.map((doc: Doc) => (
            <a
              key={doc.id}
              href={`/api/files/${doc.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 px-4 py-3.5 hover:border-pink-200 transition-colors"
            >
              <div className="text-foreground/50">
                <DocIcon />
              </div>
              <span className="text-sm font-medium text-foreground truncate">{doc.originalName}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100/60 px-4 py-4">
          <p className="text-sm text-foreground/40 text-center">No documents uploaded yet.</p>
        </div>
      )}
    </div>
  );
}
