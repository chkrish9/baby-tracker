"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocumentsRedirect({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const router = useRouter();
  useEffect(() => { router.replace(`/babies/${babyId}/photos`); }, [babyId, router]);
  return null;
}
