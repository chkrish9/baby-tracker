"use client";
import { use, useState } from "react";
import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ParentLink {
  id: string;
  userId: string;
  role: "OWNER" | "PARENT";
  user: { id: string; name: string | null; email: string };
}

function ParentsList({ babyId }: { babyId: string }) {
  const { data: session } = useSession();
  const { data: parents, isLoading } = useSWR<ParentLink[]>(`/api/babies/${babyId}/parents`, fetcher);
  const { toast } = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const myLink = parents?.find((p) => p.userId === session?.user?.id);
  const isOwner = myLink?.role === "OWNER";

  async function handleRemove(link: ParentLink) {
    const isSelf = link.userId === session?.user?.id;
    const confirmed = window.confirm(
      isSelf ? "Leave this baby? You'll lose access unless re-invited." : `Remove ${link.user.name ?? link.user.email} from this baby?`
    );
    if (!confirmed) return;

    setRemovingId(link.id);
    const res = await fetch(`/api/babies/${babyId}/parents/${link.id}`, { method: "DELETE" });
    setRemovingId(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to remove", "error"); return; }
    await mutate(`/api/babies/${babyId}/parents`);
    toast(isSelf ? "You left this baby" : "Co-parent removed", "success");
  }

  if (isLoading) return null;
  if (!parents?.length) return null;

  return (
    <Card>
      <p className="text-sm font-medium text-foreground mb-3">Co-parents</p>
      <div className="space-y-3">
        {parents.map((link) => {
          const canRemove = link.role !== "OWNER" && (isOwner || link.userId === session?.user?.id);
          return (
            <div key={link.id} className="flex items-center gap-3">
              <Avatar name={link.user.name ?? link.user.email} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{link.user.name ?? link.user.email}</p>
                {link.user.name && <p className="text-xs text-foreground/50 truncate">{link.user.email}</p>}
              </div>
              {link.role === "OWNER" && <Badge variant="pink">Owner</Badge>}
              {canRemove && (
                <Button
                  size="sm"
                  variant="danger"
                  loading={removingId === link.id}
                  onClick={() => handleRemove(link)}
                >
                  {link.userId === session?.user?.id ? "Leave" : "Remove"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

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
      <PageHeader title="Parents & invites" backHref={`/babies/${babyId}`} />
      <div className="px-4 space-y-4">
        <ParentsList babyId={babyId} />

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
