"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

const TYPES = [
  { value: "WET", label: "Wet" },
  { value: "DIRTY", label: "Dirty" },
  { value: "BOTH", label: "Wet + Dirty" },
  { value: "DRY", label: "Dry" },
];

export default function NewDiaperPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState("WET");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: Record<string, unknown> = { type };
    if (notes) body.notes = notes;

    const res = await fetch(`/api/babies/${babyId}/diapers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) { toast("Failed to log diaper", "error"); return; }
    await mutate(`/api/babies/${babyId}/diapers`);
    toast("Diaper logged!", "success");
    router.push(`/babies/${babyId}/diapers`);
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Log diaper" />
      <div className="px-4">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${type === t.value ? "border-pink-300 bg-pink-50 text-pink-700" : "border-pink-100 text-foreground hover:border-pink-200"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes…" />
            </div>
            <Button type="submit" loading={loading} className="w-full">Save</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
