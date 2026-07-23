"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api-client";

export default function NewBabyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await apiFetch("/api/babies", {
      method: "POST",
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
    if (!res.ok) { toast("Failed to create baby", "error"); return; }
    const baby = await res.json();
    await mutate("/api/babies");
    toast(`${baby.name} added!`, "success");
    router.push(`/babies/${baby.id}`);
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Add a baby" backHref="/dashboard" />
      <div className="px-4">
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
          <Button type="submit" loading={loading} className="w-full !py-3">Add baby</Button>
        </form>
      </div>
    </div>
  );
}
