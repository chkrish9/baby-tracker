"use client";
import { use, useEffect, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { formatBytes } from "@/lib/utils";
import { FlagAppointmentsModal } from "@/components/doctor-visit/FlagAppointmentsModal";
import { apiFetch, filesUrl } from "@/lib/api-client";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

interface Photo { id: string; path: string; filename: string; size: number; caption?: string | null; appointmentIds: string[]; takenAt: string; }

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V2.5h4V4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
    </svg>
  );
}

function FlagIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v12" />
      <path d="M4 2.5h7l-1.5 2.5L11 7.5H4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6l-2 3H6a2 2 0 00-2 2v13a2 2 0 002 2h20a2 2 0 002-2V11a2 2 0 00-2-2h-4l-2-3h-8z" />
      <circle cx="16" cy="17" r="4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === "left" ? "M12.5 4l-6 6 6 6" : "M7.5 4l6 6-6 6"} />
    </svg>
  );
}

function PhotoLightbox({ photos, index, onClose, onNavigate }: { photos: Photo[]; index: number; onClose: () => void; onNavigate: (i: number) => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onNavigate((index - 1 + photos.length) % photos.length);
      else if (e.key === "ArrowRight") onNavigate((index + 1) % photos.length);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, photos.length, onClose, onNavigate]);

  const photo = photos[index];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <CloseIcon />
      </button>

      {photos.length > 1 && (
        <button
          onClick={() => onNavigate((index - 1 + photos.length) % photos.length)}
          className="absolute left-2 sm:left-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          aria-label="Previous photo"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={filesUrl(photo.path)}
        alt={photo.filename}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
      />

      {photos.length > 1 && (
        <button
          onClick={() => onNavigate((index + 1) % photos.length)}
          className="absolute right-2 sm:right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          aria-label="Next photo"
        >
          <ChevronIcon direction="right" />
        </button>
      )}

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

export default function PhotosPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { toast } = useToast();
  const [flaggingPhoto, setFlaggingPhoto] = useState<Photo | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: photos, isLoading: photosLoading } = useSWR(`/api/babies/${babyId}/photos`, fetcher);

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    const res = await apiFetch(`/api/babies/${babyId}/photos`, { method: "POST", body: formData });
    if (res.ok) { await mutate(`/api/babies/${babyId}/photos`); toast("Photos uploaded!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  async function handleDeletePhoto(photoId: string) {
    const res = await apiFetch(`/api/babies/${babyId}/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) { await mutate(`/api/babies/${babyId}/photos`); toast("Photo deleted", "success"); }
    else toast("Failed to delete", "error");
  }

  async function handleSavePhotoFlags(photoId: string, appointmentIds: string[]) {
    const res = await apiFetch(`/api/babies/${babyId}/photos/${photoId}/appointments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentIds }),
    });
    if (res.ok) {
      await mutate(`/api/babies/${babyId}/photos`);
      toast(appointmentIds.length === 0 ? "Unflagged" : "Flagged for the doctor", "success");
    } else toast("Failed to update", "error");
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-4">
        <h1 className="text-2xl font-bold text-foreground font-serif">Photos</h1>
        <Button size="sm" onClick={() => photoInputRef.current?.click()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="mr-1.5">
            <path d="M7 1v12M1 7h12" />
          </svg>
          Upload
        </Button>
      </div>

      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />

      {photosLoading && <div className="flex justify-center py-12"><Spinner /></div>}

      <div className="px-4 pb-6">
        {!photosLoading && (
          !photos?.length ? (
            <div className="border-2 border-dashed border-pink-200 rounded-2xl p-12 text-center cursor-pointer hover:border-pink-300 transition-colors" onClick={() => photoInputRef.current?.click()}>
              <div className="flex justify-center mb-3 text-foreground/30"><CameraIcon /></div>
              <p className="font-medium text-foreground text-sm mb-1">Add your first photo</p>
              <p className="text-xs text-foreground/40">Capture milestones, rashes, or diaper photos to show at the next visit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo: Photo, i: number) => (
                <div
                  key={photo.id}
                  className="relative group rounded-2xl overflow-hidden bg-pink-50 border border-pink-100/60 aspect-square cursor-pointer"
                  onClick={() => setViewerIndex(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filesUrl(photo.path)}
                    alt={photo.filename}
                    className="object-cover w-full h-full"
                  />
                  {photo.appointmentIds.length > 0 && (
                    <div className="absolute top-2 left-2 bg-pink-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm">
                      <FlagIcon filled />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-between p-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setFlaggingPhoto(photo); }}
                        className={`rounded-full w-8 h-8 flex items-center justify-center ${photo.appointmentIds.length > 0 ? "bg-pink-500 text-white" : "bg-white/80 text-foreground/60"}`}
                        aria-label={photo.appointmentIds.length > 0 ? "Edit flagged appointments" : "Flag photo for the doctor"}
                      >
                        <FlagIcon filled={photo.appointmentIds.length > 0} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} className="bg-white/80 text-red-500 rounded-full w-8 h-8 flex items-center justify-center">
                        <TrashIcon />
                      </button>
                    </div>
                    <span className="text-white text-xs">{formatBytes(photo.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <FlagAppointmentsModal
        open={!!flaggingPhoto}
        onClose={() => setFlaggingPhoto(null)}
        babyId={babyId}
        currentAppointmentIds={flaggingPhoto?.appointmentIds ?? []}
        onSave={(appointmentIds) => handleSavePhotoFlags(flaggingPhoto!.id, appointmentIds)}
      />

      {viewerIndex !== null && photos?.length > 0 && (
        <PhotoLightbox
          photos={photos}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  );
}
