import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { filesUrl } from "@/lib/api-client";

interface Baby {
  id: string;
  name: string;
  birthDate: string;
  profilePhoto?: string | null;
}

function ageLabel(birthDate: string) {
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

export function BabyCard({ baby, index }: { baby: Baby; index?: number }) {
  const photoSrc = baby.profilePhoto ? filesUrl(baby.profilePhoto) : undefined;
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
