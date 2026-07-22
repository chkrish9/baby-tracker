"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useBabies } from "@/hooks/useBaby";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

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

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5a1.5 1.5 0 012.12 2.12l-7.5 7.5-3 .88.88-3 7.5-7.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V2.5h4V4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
    </svg>
  );
}

interface Baby { id: string; name: string; birthDate: string; profilePhoto?: string | null; }

export default function DashboardPage() {
  const { data: babies, isLoading } = useBabies();
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleBack() {
    const activeBabyId = localStorage.getItem("activeBabyId");
    if (activeBabyId) {
      router.push(`/babies/${activeBabyId}`);
    } else {
      router.back();
    }
  }

  function handleEdit(e: React.MouseEvent, babyId: string) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/babies/${babyId}/edit`);
  }

  async function handleDelete(e: React.MouseEvent, baby: Baby) {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(`Delete ${baby.name}? This permanently removes all their logs, photos, and appointments.`);
    if (!confirmed) return;
    setDeletingId(baby.id);
    const res = await fetch(`/api/babies/${baby.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to delete baby", "error"); return; }
    await mutate("/api/babies");
    toast("Baby deleted", "success");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-5">
        {!isLoading && babies?.length > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-pink-100/60 text-foreground hover:bg-pink-50 transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-bold text-foreground font-serif">Your babies</h1>
      </div>

      <p className="text-sm text-foreground/50 mb-5">
        Each baby keeps their own feeding logs, diaper history, and photos. Tap a baby to switch.
      </p>

      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}

      <div className="space-y-3">
        {babies?.map((baby: Baby, i: number) => (
          <Link key={baby.id} href={`/babies/${baby.id}`}>
            <div className="flex items-center gap-4 bg-white rounded-2xl border border-pink-100/60 p-4 hover:border-pink-200 transition-colors cursor-pointer">
              <Avatar src={baby.profilePhoto ? `/api/files/${baby.profilePhoto}` : undefined} name={baby.name} size={52} colorIndex={i} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{baby.name}</p>
                <p className="text-sm text-foreground/50">{ageLabel(baby.birthDate)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => handleEdit(e, baby.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-foreground/30 hover:text-foreground/60 hover:bg-pink-50 transition-colors"
                  aria-label={`Edit ${baby.name}`}
                >
                  <EditIcon />
                </button>
                <button
                  onClick={(e) => handleDelete(e, baby)}
                  disabled={deletingId === baby.id}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-foreground/30 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label={`Delete ${baby.name}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </Link>
        ))}

        {!isLoading && (
          <Link href="/babies/new">
            <div className="flex items-center justify-center gap-2 bg-white/50 rounded-2xl border border-dashed border-pink-200 p-4 text-foreground/50 hover:text-foreground/70 hover:border-pink-300 transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M9 3v12M3 9h12" />
              </svg>
              <span className="text-sm font-medium">Add a baby</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
