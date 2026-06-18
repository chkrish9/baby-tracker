"use client";
import { use, useRef } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { useBaby } from "@/hooks/useBaby";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

function ageLabel(birthDate: string) {
  const birth = new Date(birthDate);
  const days = Math.floor((Date.now() - birth.getTime()) / 86400000);
  if (days < 7) return `${days} days old`;
  if (days < 30) return `${Math.floor(days / 7)} weeks old`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} months old`;
  return `${Math.floor(months / 12)} years old`;
}

export default function BabyProfilePage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: baby, isLoading } = useBaby(babyId);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-4">
        {/* Clickable avatar for photo upload */}
        <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
          <Avatar src={photoSrc} name={baby.name} size={72} />
          <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-lg">📷</span>
          </div>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{baby.name}</h1>
          <p className="text-pink-400 text-sm">{ageLabel(baby.birthDate)}</p>
          <p className="text-xs text-foreground/40 mt-0.5">Tap photo to change</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/babies/${babyId}/feeding`}>
          <Card className="text-center hover:border-pink-300 cursor-pointer transition-colors">
            <div className="text-3xl mb-1">🍼</div>
            <CardTitle>Feedings</CardTitle>
          </Card>
        </Link>
        <Link href={`/babies/${babyId}/diapers`}>
          <Card className="text-center hover:border-pink-300 cursor-pointer transition-colors">
            <div className="text-3xl mb-1">👶</div>
            <CardTitle>Diapers</CardTitle>
          </Card>
        </Link>
        <Link href={`/babies/${babyId}/photos`}>
          <Card className="text-center hover:border-pink-300 cursor-pointer transition-colors">
            <div className="text-3xl mb-1">📷</div>
            <CardTitle>Photos</CardTitle>
          </Card>
        </Link>
        <Link href={`/babies/${babyId}/documents`}>
          <Card className="text-center hover:border-pink-300 cursor-pointer transition-colors">
            <div className="text-3xl mb-1">📄</div>
            <CardTitle>Documents</CardTitle>
          </Card>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Parents</CardTitle>
          <Link href={`/babies/${babyId}/invite`}><Button size="sm" variant="secondary">Invite</Button></Link>
        </div>
        <div className="space-y-2">
          {baby.parents?.map((p: { id: string; role: string; user: { name?: string; email: string } }) => (
            <div key={p.id} className="flex items-center gap-2">
              <Avatar name={p.user.name ?? p.user.email} size={32} />
              <span className="text-sm text-foreground">{p.user.name ?? p.user.email}</span>
              {p.role === "OWNER" && <Badge variant="pink">Owner</Badge>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
