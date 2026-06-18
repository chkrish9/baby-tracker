"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface InviteInfo { baby: { id: string; name: string }; invitedBy: { name?: string; email: string }; email: string; }

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => { if (!r.ok) throw r; return r.json(); })
      .then(setInfo)
      .catch(async (r) => { const d = await r.json().catch(() => ({})); setError(d.error ?? "Invalid invite"); })
      .finally(() => setFetching(false));
  }, [token]);

  async function handleAccept() {
    if (!session) { router.push(`/login?callbackUrl=/invite/${token}`); return; }
    setLoading(true);
    const res = await fetch(`/api/invites/${token}`, { method: "POST" });
    setLoading(false);
    if (res.ok) { const d = await res.json(); router.push(`/babies/${d.babyId}`); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Failed to accept invite"); }
  }

  if (fetching || status === "loading") return (
    <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">🍼</div>
        {error ? (
          <>
            <h1 className="text-xl font-bold text-foreground mb-2">Invalid invite</h1>
            <p className="text-pink-400 text-sm mb-6">{error}</p>
            <Link href="/dashboard"><Button>Go to dashboard</Button></Link>
          </>
        ) : info ? (
          <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 space-y-4">
            <h1 className="text-xl font-bold text-foreground">You&apos;re invited!</h1>
            <p className="text-sm text-foreground">
              <span className="font-medium">{info.invitedBy.name ?? info.invitedBy.email}</span> invited you to track <span className="font-medium text-pink-600">{info.baby.name}</span>.
            </p>
            {!session && (
              <p className="text-xs text-pink-400">You&apos;ll need to sign in or create an account first.</p>
            )}
            <Button onClick={handleAccept} loading={loading} className="w-full">
              {session ? "Accept invite" : "Sign in to accept"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
