"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function NewBabyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/babies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate }),
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
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Baby&apos;s name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Emma" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Date of birth</label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required max={new Date().toISOString().split("T")[0]} />
          </div>
          <Button type="submit" loading={loading} className="w-full !py-3">Add baby</Button>
        </form>
      </div>
    </div>
  );
}
