import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

interface Baby {
  id: string;
  name: string;
  birthDate: string;
  profilePhoto?: string | null;
}

function ageLabel(birthDate: string) {
  const birth = new Date(birthDate);
  const days = Math.floor((Date.now() - birth.getTime()) / 86400000);
  if (days < 7) return `${days}d old`;
  if (days < 30) return `${Math.floor(days / 7)}w old`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months}mo old`;
  return `${Math.floor(months / 12)}y old`;
}

export function BabyCard({ baby, index }: { baby: Baby; index?: number }) {
  const photoSrc = baby.profilePhoto ? `/api/files/${baby.profilePhoto}` : undefined;
  return (
    <Link href={`/babies/${baby.id}`}>
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-pink-100/60 p-4 hover:border-pink-200 transition-colors cursor-pointer">
        <Avatar src={photoSrc} name={baby.name} size={52} colorIndex={index} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{baby.name}</p>
          <p className="text-sm text-foreground/50">{ageLabel(baby.birthDate)}</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30 flex-shrink-0">
          <path d="M6 3l6 6-6 6" />
        </svg>
      </div>
    </Link>
  );
}
