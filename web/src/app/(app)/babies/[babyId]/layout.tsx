"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

export default function BabyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ babyId: string }>;
}) {
  const { babyId } = use(params);
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/babies/${babyId}`).then((res) => {
      if (cancelled) return;
      if (res.status === 401) { router.replace("/login"); return; }
      if (!res.ok) { router.replace("/dashboard"); return; }
      setAllowed(true);
    });
    return () => { cancelled = true; };
  }, [babyId, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
