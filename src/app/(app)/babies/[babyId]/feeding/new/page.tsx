"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewFeedingRedirect({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const router = useRouter();
  useEffect(() => { router.replace(`/babies/${babyId}/feeding`); }, [babyId, router]);
  return null;
}
