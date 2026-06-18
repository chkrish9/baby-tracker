"use client";
import { use, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

export default function InvitePage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/babies/${babyId}/parents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to create invite", "error"); return; }
    const { token } = await res.json();
    const link = `${window.location.origin}/invite/${token}`;
    setInviteLink(link);
    toast("Invite created!", "success");
    setEmail("");
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Invite a parent" />
      <div className="px-4 space-y-4">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Their email address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="parent@example.com" />
            </div>
            <Button type="submit" loading={loading} className="w-full">Generate invite link</Button>
          </form>
        </Card>

        {inviteLink && (
          <Card className="bg-[#e1f7ee] border-[#bdebd9]">
            <p className="text-sm font-medium text-emerald-800 mb-2">Share this link with them:</p>
            <p className="text-xs text-emerald-700 break-all font-mono bg-white rounded-lg px-3 py-2 border border-[#bdebd9]">{inviteLink}</p>
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => { navigator.clipboard.writeText(inviteLink); toast("Copied!", "success"); }}>
              Copy link
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
