"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBabies } from "@/hooks/useBaby";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";

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

interface Baby { id: string; name: string; birthDate: string; profilePhoto?: string | null; }

export default function DashboardPage() {
  const { data: babies, isLoading } = useBabies();
  const router = useRouter();

  function handleBack() {
    const activeBabyId = localStorage.getItem("activeBabyId");
    if (activeBabyId) {
      router.push(`/babies/${activeBabyId}`);
    } else {
      router.back();
    }
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
        Each baby keeps their own feeding logs, diaper history, photos and documents. Tap a baby to switch.
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
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30 flex-shrink-0">
                <path d="M6 3l6 6-6 6" />
              </svg>
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
