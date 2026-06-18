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
  { value: "BREAST_LEFT", label: "Left breast" },
  { value: "BREAST_RIGHT", label: "Right breast" },
  { value: "BOTTLE", label: "Bottle" },
  { value: "SOLID", label: "Solid food" },
];

export default function NewFeedingPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState("BREAST_LEFT");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const showAmount = type === "BOTTLE" || type === "SOLID";
  const showDuration = type === "BREAST_LEFT" || type === "BREAST_RIGHT";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: Record<string, unknown> = { type };
    if (showAmount && amount) body.amount = parseFloat(amount);
    if (showDuration && duration) body.duration = parseInt(duration);
    if (notes) body.notes = notes;

    const res = await fetch(`/api/babies/${babyId}/feeding`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) { toast("Failed to log feeding", "error"); return; }
    await mutate(`/api/babies/${babyId}/feeding`);
    toast("Feeding logged!", "success");
    router.push(`/babies/${babyId}/feeding`);
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Log feeding" />
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
            {showAmount && (
              <div>
                <Label htmlFor="amount">Amount (ml)</Label>
                <Input id="amount" type="number" min="0" step="0.1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 120" />
              </div>
            )}
            {showDuration && (
              <div>
                <Label htmlFor="duration">Duration (min)</Label>
                <Input id="duration" type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 15" />
              </div>
            )}
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
