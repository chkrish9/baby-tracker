"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PhotosRedirect({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const router = useRouter();
  useEffect(() => { router.replace(`/babies/${babyId}/documents`); }, [babyId, router]);
  return null;
}
