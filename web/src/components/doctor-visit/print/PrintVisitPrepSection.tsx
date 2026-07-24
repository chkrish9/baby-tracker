"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api-client";
import { PrintSection } from "./PrintSection";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

interface DoctorNoteItem { id: string; question: string; answered: boolean; }
interface Photo { id: string; path: string; filename: string; }
interface DiaperLogItem { id: string; type: string; notes?: string | null; loggedAt: string; }

const DIAPER_LABELS: Record<string, string> = {
  WET: "Wet diaper", DIRTY: "Dirty diaper", BOTH: "Mixed diaper", DRY: "Dry diaper",
};

interface PrintVisitPrepSectionProps {
  babyId: string;
  appointmentId: string | null;
}

export function PrintVisitPrepSection({ babyId, appointmentId }: PrintVisitPrepSectionProps) {
  const scope = appointmentId ?? "unassigned";

  const { data: notes } = useSWR<DoctorNoteItem[]>(`/api/babies/${babyId}/doctor-notes?appointmentId=${scope}`, fetcher);
  const { data: flaggedPhotos } = useSWR<Photo[]>(`/api/babies/${babyId}/photos?flagged=true&appointmentId=${scope}`, fetcher);
  const { data: flaggedDiapers } = useSWR<DiaperLogItem[]>(`/api/babies/${babyId}/diapers?flagged=true&appointmentId=${scope}`, fetcher);

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!flaggedPhotos?.length) return;
    let cancelled = false;
    const urls: Record<string, string> = {};

    Promise.all(
      flaggedPhotos.map(async (photo) => {
        const res = await apiFetch(`/api/files/${photo.path}`);
        if (!res.ok) return;
        const blob = await res.blob();
        urls[photo.id] = URL.createObjectURL(blob);
      })
    ).then(() => {
      if (!cancelled) setPhotoUrls(urls);
    });

    return () => {
      cancelled = true;
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [flaggedPhotos]);

  return (
    <>
      <PrintSection title="Questions for the doctor">
        {!notes?.length ? (
          <p className="text-sm text-black/50">No questions recorded.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <tbody>
              {notes.map((note) => (
                <tr key={note.id}>
                  <td className="py-1.5 pr-2 w-6">{note.answered ? "✓" : ""}</td>
                  <td className="py-1.5">{note.question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Flagged photos">
        {!flaggedPhotos?.length ? (
          <p className="text-sm text-black/50">No photos flagged.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {flaggedPhotos.map((photo) => (
              <div key={photo.id} className="aspect-square bg-black/5 border border-black/10 overflow-hidden">
                {photoUrls[photo.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrls[photo.id]} alt={photo.filename} className="object-cover w-full h-full" />
                )}
              </div>
            ))}
          </div>
        )}
      </PrintSection>

      <PrintSection title="Flagged diaper notes">
        {!flaggedDiapers?.length ? (
          <p className="text-sm text-black/50">No diaper notes flagged.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left">
                <th className="font-bold py-1 pr-2">Date</th>
                <th className="font-bold py-1 pr-2">Type</th>
                <th className="font-bold py-1">Note</th>
              </tr>
            </thead>
            <tbody>
              {flaggedDiapers.map((log) => (
                <tr key={log.id}>
                  <td className="py-1.5 pr-2 whitespace-nowrap">{new Date(log.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                  <td className="py-1.5 pr-2 whitespace-nowrap">{DIAPER_LABELS[log.type] ?? log.type}</td>
                  <td className="py-1.5">{log.notes ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>
    </>
  );
}
