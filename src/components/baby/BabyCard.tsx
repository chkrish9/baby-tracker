import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";

interface Baby {
  id: string;
  name: string;
  birthDate: string;
  profilePhoto?: string | null;
}

function ageLabel(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  const days = Math.floor((now.getTime() - birth.getTime()) / 86400000);
  if (days < 7) return `${days}d old`;
  if (days < 30) return `${Math.floor(days / 7)}w old`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months}mo old`;
  return `${Math.floor(months / 12)}y old`;
}

export function BabyCard({ baby }: { baby: Baby }) {
  const photoSrc = baby.profilePhoto ? `/api/files/${baby.profilePhoto}` : undefined;
  return (
    <Link href={`/babies/${baby.id}`}>
      <Card className="flex items-center gap-4 hover:border-pink-300 transition-colors cursor-pointer">
        <Avatar src={photoSrc} name={baby.name} size={56} />
        <div>
          <p className="font-semibold text-foreground">{baby.name}</p>
          <p className="text-sm text-pink-400">{ageLabel(baby.birthDate)}</p>
        </div>
        <span className="ml-auto text-pink-300">›</span>
      </Card>
    </Link>
  );
}
