"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, filesUrl } from "@/lib/api-client";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

interface DoctorNoteItem { id: string; question: string; answered: boolean; createdAt: string; }
interface Photo { id: string; path: string; filename: string; size: number; appointmentIds: string[]; }
interface DiaperLogItem { id: string; type: string; notes?: string | null; appointmentIds: string[]; loggedAt: string; }

const DIAPER_LABELS: Record<string, string> = {
  WET: "Wet diaper", DIRTY: "Dirty diaper", BOTH: "Mixed diaper", DRY: "Dry diaper"
};

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V2.5h4V4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
    </svg>
  );
}

function FlagIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v12" />
      <path d="M4 2.5h7l-1.5 2.5L11 7.5H4" />
    </svg>
  );
}

interface VisitPrepProps {
  babyId: string;
  /** The appointment these items are scoped to, or null for the "not yet assigned to a visit" bucket. */
  appointmentId: string | null;
}

export function VisitPrep({ babyId, appointmentId }: VisitPrepProps) {
  const { toast } = useToast();
  const scope = appointmentId ?? "unassigned";

  const { data: notes } = useSWR<DoctorNoteItem[]>(`/api/babies/${babyId}/doctor-notes?appointmentId=${scope}`, fetcher);
  const { data: flaggedPhotos } = useSWR<Photo[]>(`/api/babies/${babyId}/photos?flagged=true&appointmentId=${scope}`, fetcher);
  const { data: flaggedDiapers } = useSWR<DiaperLogItem[]>(`/api/babies/${babyId}/diapers?flagged=true&appointmentId=${scope}`, fetcher);

  const [questionText, setQuestionText] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);

  const notesKey = `/api/babies/${babyId}/doctor-notes?appointmentId=${scope}`;
  const photosKey = `/api/babies/${babyId}/photos?flagged=true&appointmentId=${scope}`;
  const diapersKey = `/api/babies/${babyId}/diapers?flagged=true&appointmentId=${scope}`;

  const unansweredCount = notes?.filter((n) => !n.answered).length ?? 0;
  const sortedNotes = [...(notes ?? [])].sort((a, b) => Number(a.answered) - Number(b.answered));

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim()) return;
    setAddingQuestion(true);
    const res = await apiFetch(`/api/babies/${babyId}/doctor-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionText, appointmentId }),
    });
    setAddingQuestion(false);
    if (!res.ok) { toast("Failed to add question", "error"); return; }
    await mutate(notesKey);
    setQuestionText("");
  }

  async function handleToggleAnswered(note: DoctorNoteItem) {
    const res = await apiFetch(`/api/babies/${babyId}/doctor-notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answered: !note.answered }),
    });
    if (res.ok) mutate(notesKey);
    else toast("Failed to update", "error");
  }

  async function handleDeleteQuestion(id: string) {
    const res = await apiFetch(`/api/babies/${babyId}/doctor-notes/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(notesKey); toast("Question removed", "success"); }
    else toast("Failed to delete", "error");
  }

  async function handleUnflagPhoto(photoId: string) {
    if (!appointmentId) return;
    const res = await apiFetch(`/api/babies/${babyId}/photos/${photoId}/appointments/${appointmentId}`, { method: "DELETE" });
    if (res.ok) { mutate(photosKey); toast("Unflagged", "success"); }
    else toast("Failed to update", "error");
  }

  async function handleUnflagDiaper(logId: string) {
    if (!appointmentId) return;
    const res = await apiFetch(`/api/babies/${babyId}/diapers/${logId}/appointments/${appointmentId}`, { method: "DELETE" });
    if (res.ok) { mutate(diapersKey); toast("Unflagged", "success"); }
    else toast("Failed to update", "error");
  }

  return (
    <>
      {/* Questions for the doctor */}
      <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-2">
        Questions for the doctor{unansweredCount > 0 ? ` (${unansweredCount})` : ""}
      </p>
      <div className="bg-white rounded-2xl border border-pink-100/60 p-4 mb-5">
        <form onSubmit={handleAddQuestion} className="flex gap-2 mb-3">
          <Input
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. Is this rash normal?"
            className="flex-1"
          />
          <Button type="submit" size="sm" loading={addingQuestion}>Add</Button>
        </form>

        {sortedNotes.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-2">
            No questions yet. Jot one down whenever it comes to mind, and ask it at this visit.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedNotes.map((note) => (
              <div key={note.id} className="flex items-center gap-2.5 py-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleAnswered(note)}
                  aria-label={note.answered ? "Mark as not asked" : "Mark as asked"}
                  className={`flex items-center justify-center w-5 h-5 rounded-full border flex-shrink-0 transition-colors ${
                    note.answered ? "bg-pink-500 border-pink-500 text-white" : "border-pink-200 text-transparent hover:border-pink-400"
                  }`}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6l2.5 2.5 4.5-5" />
                  </svg>
                </button>
                <p className={`flex-1 text-sm ${note.answered ? "text-foreground/40 line-through" : "text-foreground"}`}>
                  {note.question}
                </p>
                <button onClick={() => handleDeleteQuestion(note.id)} className="text-foreground/20 hover:text-red-400 transition-colors flex-shrink-0">
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flagged Photos */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase">Flagged photos</p>
        <Link href={`/babies/${babyId}/photos`} className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors">Manage photos</Link>
      </div>
      {flaggedPhotos?.length ? (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {flaggedPhotos.map((photo) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-pink-50 border border-pink-100/60 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={filesUrl(photo.path)} alt={photo.filename} className="object-cover w-full h-full" />
              <button
                onClick={() => handleUnflagPhoto(photo.id)}
                className="absolute top-1 right-1 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Unflag photo"
              >
                <FlagIcon filled />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100/60 px-4 py-4 mb-5">
          <p className="text-sm text-foreground/40 text-center">
            No photos flagged yet. Tap the flag on any photo to add it here.
          </p>
        </div>
      )}

      {/* Flagged Diaper Notes */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase">Flagged diaper notes</p>
        <Link href={`/babies/${babyId}/feeding?tab=diaper`} className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors">View diaper log</Link>
      </div>
      {flaggedDiapers?.length ? (
        <div className="space-y-2 mb-5">
          {flaggedDiapers.map((log) => (
            <div key={log.id} className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{DIAPER_LABELS[log.type] ?? log.type}</p>
                <p className="text-xs text-foreground/50 truncate">{log.notes ?? "No note"}</p>
              </div>
              <p className="text-xs text-foreground/40 flex-shrink-0">
                {new Date(log.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <button onClick={() => handleUnflagDiaper(log.id)} className="text-pink-500 hover:text-pink-600 transition-colors flex-shrink-0">
                <FlagIcon filled />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100/60 px-4 py-4 mb-5">
          <p className="text-sm text-foreground/40 text-center">No flagged diaper notes.</p>
        </div>
      )}
    </>
  );
}
