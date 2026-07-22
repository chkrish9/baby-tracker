"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useBaby } from "@/hooks/useBaby";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export default function EditBabyPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: baby, isLoading } = useBaby(babyId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!baby) return;
    setFirstName(baby.firstName ?? "");
    setLastName(baby.lastName ?? "");
    setNickname(baby.nickname ?? "");
    setBirthDate(toDateInputValue(baby.birthDate));
    setWeight(baby.weight != null ? String(baby.weight) : "");
    setHeight(baby.height != null ? String(baby.height) : "");
  }, [baby]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/babies/${babyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        nickname: nickname || null,
        birthDate,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) { toast("Failed to update baby", "error"); return; }
    await mutate(`/api/babies/${babyId}`);
    await mutate("/api/babies");
    toast("Baby updated!", "success");
    router.push(`/babies/${babyId}`);
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete ${baby?.name ?? "this baby"}? This permanently removes all their logs, photos, and appointments.`);
    if (!confirmed) return;
    setDeleting(true);
    const res = await fetch(`/api/babies/${babyId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to delete baby", "error"); return; }
    await mutate("/api/babies");
    toast("Baby deleted", "success");
    router.push("/dashboard");
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (!baby) return null;

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Edit baby" backHref={`/babies/${babyId}`} />
      <div className="px-4 space-y-4 pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-pink-100/60 p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-1.5">First name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="e.g. Emma" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-1.5">Last name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="e.g. Smith" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Nickname <span className="text-foreground/40 font-normal">(optional)</span>
            </label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Emmy" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Date of birth</label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required max={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Weight (kg) <span className="text-foreground/40 font-normal">(optional)</span>
              </label>
              <Input type="number" step="0.01" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 3.4" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Height (cm) <span className="text-foreground/40 font-normal">(optional)</span>
              </label>
              <Input type="number" step="0.1" min="0" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 50" />
            </div>
          </div>
          <Button type="submit" loading={loading} className="w-full !py-3">Save changes</Button>
        </form>

        <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
          <Button type="button" variant="danger" loading={deleting} onClick={handleDelete} className="w-full">
            Delete baby
          </Button>
        </div>
      </div>
    </div>
  );
}
