"use client";
import { use, useRef } from "react";
import useSWR, { mutate } from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatBytes } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Photo { id: string; path: string; filename: string; size: number; caption?: string | null; takenAt: string; }

export default function PhotosPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: photos, isLoading } = useSWR(`/api/babies/${babyId}/photos`, fetcher);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    const res = await fetch(`/api/babies/${babyId}/photos`, { method: "POST", body: formData });
    if (res.ok) { await mutate(`/api/babies/${babyId}/photos`); toast("Photos uploaded!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  async function handleDelete(photoId: string) {
    const res = await fetch(`/api/babies/${babyId}/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) { await mutate(`/api/babies/${babyId}/photos`); toast("Photo deleted", "success"); }
    else toast("Failed to delete", "error");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Photos"
        action={<Button size="sm" onClick={() => inputRef.current?.click()}>+ Upload</Button>}
      />
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}
      {!isLoading && !photos?.length && (
        <div className="text-center py-16 text-pink-400">
          <div className="text-5xl mb-3">📷</div>
          <p className="mb-4">No photos yet</p>
          <Button onClick={() => inputRef.current?.click()}>Upload photos</Button>
        </div>
      )}
      <div className="px-4 grid grid-cols-2 sm:grid-cols-3 gap-3 pb-6">
        {photos?.map((photo: Photo) => (
          <div key={photo.id} className="relative group rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/files/${photo.path}`} alt={photo.filename} className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-between p-2">
              <button onClick={() => handleDelete(photo.id)} className="bg-white/80 text-red-500 rounded-full w-7 h-7 flex items-center justify-center text-sm">&times;</button>
              <span className="text-white text-xs">{formatBytes(photo.size)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
