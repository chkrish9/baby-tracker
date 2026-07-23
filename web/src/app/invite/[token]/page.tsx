"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SECTIONS, type Section } from "@/lib/sections";

interface InviteInfo { babies: { id: string; name: string; sections: Section[] }[]; invitedBy: { name?: string; email: string }; email: string; hasAccount: boolean; }

function sectionLabels(sections: Section[]) {
  return SECTIONS.filter((s) => sections.includes(s.key)).map((s) => s.label).join(", ");
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { user: session, isLoading } = useCurrentUser();
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    apiFetch(`/api/invites/${token}`)
      .then((r) => { if (!r.ok) throw r; return r.json(); })
      .then(setInfo)
      .catch(async (r) => { const d = await r.json().catch(() => ({})); setError(d.error ?? "Invalid invite"); })
      .finally(() => setFetching(false));
  }, [token]);

  function handleUnauthenticated() {
    if (!info) return;
    const callbackUrl = encodeURIComponent(`/invite/${token}`);
    const email = encodeURIComponent(info.email);
    const dest = info.hasAccount ? "login" : "register";
    router.push(`/${dest}?callbackUrl=${callbackUrl}&email=${email}`);
  }

  async function handleAccept() {
    if (!session) { handleUnauthenticated(); return; }
    setLoading(true);
    const res = await apiFetch(`/api/invites/${token}`, { method: "POST" });
    setLoading(false);
    if (res.ok) { const d = await res.json(); router.push(`/babies/${d.babyIds[0]}`); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Failed to accept invite"); }
  }

  if (fetching || isLoading) return (
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
              <span className="font-medium">{info.invitedBy.name ?? info.invitedBy.email}</span> invited you to track{" "}
              <span className="font-medium text-pink-600">{joinNames(info.babies.map((b) => b.name))}</span>.
            </p>
            <div className="text-left bg-pink-50/50 rounded-2xl p-3 space-y-1">
              {info.babies.map((baby) => (
                <p key={baby.id} className="text-xs text-foreground/60">
                  <span className="font-medium text-foreground/80">{baby.name}:</span> {sectionLabels(baby.sections)}
                </p>
              ))}
            </div>
            {!session && (
              <p className="text-xs text-pink-400">
                {info.hasAccount
                  ? "You'll need to sign in first, then you'll land back here."
                  : "You'll need to create an account first, then you'll land back here."}
              </p>
            )}
            <Button onClick={handleAccept} loading={loading} className="w-full">
              {session ? "Accept invite" : info.hasAccount ? "Sign in to accept" : "Sign up to accept"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
