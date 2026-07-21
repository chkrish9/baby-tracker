"use client";
import { use, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { useBaby } from "@/hooks/useBaby";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { VisitPrep } from "@/components/doctor-visit/VisitPrep";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FeedingLog { id: string; type: string; loggedAt: string; }
interface DiaperLog { id: string; type: string; notes?: string | null; loggedAt: string; }
interface Doc { id: string; path: string; originalName: string; mimeType: string; }
interface Appointment { id: string; date: string; notes?: string | null; }
interface FlaggedItem { id: string; }

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6l-4-4z" />
      <path d="M9 2v4h4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V2.5h4V4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5a1.5 1.5 0 012.12 2.12l-7.5 7.5-3 .88.88-3 7.5-7.5z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="14" height="13" rx="2" />
      <path d="M2 7h14M6 1.5v3M12 1.5v3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function relativeDayLabel(iso: string) {
  const target = new Date(iso);
  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((startTarget.getTime() - startOfToday().getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DoctorVisitPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: baby, isLoading: babyLoading } = useBaby(babyId);
  const { data: feedings } = useSWR(`/api/babies/${babyId}/feeding`, fetcher);
  const { data: diapers } = useSWR(`/api/babies/${babyId}/diapers`, fetcher);
  const { data: docs } = useSWR(`/api/babies/${babyId}/documents`, fetcher);
  const { data: appointments } = useSWR<Appointment[]>(`/api/babies/${babyId}/appointments`, fetcher);
  const { data: flaggedPhotosAll } = useSWR<FlaggedItem[]>(`/api/babies/${babyId}/photos?flagged=true`, fetcher);
  const { data: flaggedDiapersAll } = useSWR<FlaggedItem[]>(`/api/babies/${babyId}/diapers?flagged=true`, fetcher);
  const { toast } = useToast();

  const [showApptModal, setShowApptModal] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [apptDate, setApptDate] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [apptLoading, setApptLoading] = useState(false);
  const [showApptHistory, setShowApptHistory] = useState(false);

  if (babyLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const feeds24h = feedings?.filter((f: FeedingLog) => new Date(f.loggedAt).getTime() > cutoff).length ?? 0;
  const diapers24h = diapers?.filter((d: DiaperLog) => new Date(d.loggedAt).getTime() > cutoff).length ?? 0;
  const flaggedItems = (flaggedPhotosAll?.length ?? 0) + (flaggedDiapersAll?.length ?? 0);

  const today = startOfToday();
  const upcoming = (appointments ?? []).filter((a) => new Date(a.date) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = (appointments ?? []).filter((a) => new Date(a.date) < today).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const nextAppt = upcoming[0];
  const previousAppt = past[0];
  const allAppointments = [...(appointments ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function openAddAppt() {
    setEditingApptId(null);
    setApptDate(toDateInputValue(new Date().toISOString()));
    setApptNotes("");
    setShowApptModal(true);
  }

  function openEditAppt(appt: Appointment) {
    setEditingApptId(appt.id);
    setApptDate(toDateInputValue(appt.date));
    setApptNotes(appt.notes ?? "");
    setShowApptModal(true);
  }

  async function handleSaveAppt(e: React.FormEvent) {
    e.preventDefault();
    if (!apptDate) return;
    setApptLoading(true);
    const body = { date: new Date(`${apptDate}T00:00:00`).toISOString(), notes: apptNotes || null };
    const url = editingApptId ? `/api/babies/${babyId}/appointments/${editingApptId}` : `/api/babies/${babyId}/appointments`;
    const res = await fetch(url, { method: editingApptId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setApptLoading(false);
    if (!res.ok) { toast("Failed to save appointment", "error"); return; }
    await mutate(`/api/babies/${babyId}/appointments`);
    toast(editingApptId ? "Appointment updated!" : "Appointment added!", "success");
    setShowApptModal(false);
  }

  async function handleDeleteAppt(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/babies/${babyId}/appointments/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(`/api/babies/${babyId}/appointments`); toast("Appointment removed", "success"); }
    else toast("Failed to delete", "error");
  }

  function handleEditApptClick(appt: Appointment, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    openEditAppt(appt);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link
          href={`/babies/${babyId}`}
          className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-pink-100/60 text-foreground hover:bg-pink-50 transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-foreground font-serif">Doctor visit</h1>
      </div>

      <p className="text-sm text-foreground/50 mb-5">
        Everything you flagged for {baby?.name ?? "your baby"}&apos;s next appointment, gathered in one place.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-pink-100/60 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{feeds24h}</p>
          <p className="text-xs text-foreground/40 mt-1">Feeds / 24h</p>
        </div>
        <div className="bg-white rounded-2xl border border-pink-100/60 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{diapers24h}</p>
          <p className="text-xs text-foreground/40 mt-1">Diapers / 24h</p>
        </div>
        <div className="bg-white rounded-2xl border border-pink-100/60 p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{flaggedItems}</p>
          <p className="text-xs text-foreground/40 mt-1">Flagged items</p>
        </div>
      </div>

      {/* Appointments */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase">Appointments</p>
        <Button size="sm" variant="secondary" onClick={openAddAppt}>+ Add appointment</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {nextAppt ? (
          <Link href={`/babies/${babyId}/doctor-visit/${nextAppt.id}`} className="bg-white rounded-2xl border border-pink-100/60 p-4 hover:border-pink-200 transition-colors">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <CalendarIcon />
              Next visit
            </div>
            <p className="text-sm font-bold text-foreground">{relativeDayLabel(nextAppt.date)}</p>
            <p className="text-xs text-foreground/50 mt-0.5">{formatApptDate(nextAppt.date)}</p>
          </Link>
        ) : (
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <CalendarIcon />
              Next visit
            </div>
            <p className="text-sm text-foreground/40">None scheduled</p>
          </div>
        )}
        {previousAppt ? (
          <Link href={`/babies/${babyId}/doctor-visit/${previousAppt.id}`} className="bg-white rounded-2xl border border-pink-100/60 p-4 hover:border-pink-200 transition-colors">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <CalendarIcon />
              Previous visit
            </div>
            <p className="text-sm font-bold text-foreground">{relativeDayLabel(previousAppt.date)}</p>
            <p className="text-xs text-foreground/50 mt-0.5">{formatApptDate(previousAppt.date)}</p>
          </Link>
        ) : (
          <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
            <div className="flex items-center gap-1.5 text-xs text-foreground/40 font-medium uppercase tracking-wide mb-1.5">
              <CalendarIcon />
              Previous visit
            </div>
            <p className="text-sm text-foreground/40">No past visits</p>
          </div>
        )}
      </div>

      {allAppointments.length > 0 && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowApptHistory((v) => !v)}
            className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            {showApptHistory ? "Hide all appointments" : `View all appointments (${allAppointments.length})`}
          </button>
          {showApptHistory && (
            <div className="space-y-2 mt-2">
              {allAppointments.map((appt) => (
                <Link
                  key={appt.id}
                  href={`/babies/${babyId}/doctor-visit/${appt.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5 hover:border-pink-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{formatApptDate(appt.date)}</p>
                    {appt.notes && <p className="text-xs text-foreground/50 truncate">{appt.notes}</p>}
                  </div>
                  <p className="text-xs text-foreground/40 flex-shrink-0">{relativeDayLabel(appt.date)}</p>
                  <button onClick={(e) => handleEditApptClick(appt, e)} className="text-foreground/20 hover:text-foreground/60 transition-colors flex-shrink-0">
                    <EditIcon />
                  </button>
                  <button onClick={(e) => handleDeleteAppt(appt.id, e)} className="text-foreground/20 hover:text-red-400 transition-colors flex-shrink-0">
                    <TrashIcon />
                  </button>
                  <ChevronIcon />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <VisitPrep babyId={babyId} appointmentId={nextAppt?.id ?? null} />

      {/* Documents */}
      <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-2">Documents</p>
      {docs?.length ? (
        <div className="space-y-2">
          {docs.map((doc: Doc) => (
            <a
              key={doc.id}
              href={`/api/files/${doc.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 px-4 py-3.5 hover:border-pink-200 transition-colors"
            >
              <div className="text-foreground/50">
                <DocIcon />
              </div>
              <span className="text-sm font-medium text-foreground truncate">{doc.originalName}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-pink-100/60 px-4 py-4">
          <p className="text-sm text-foreground/40 text-center">No documents uploaded yet.</p>
        </div>
      )}

      {/* Add/edit appointment modal */}
      <Modal open={showApptModal} onClose={() => setShowApptModal(false)} title={editingApptId ? "Edit appointment" : "Add appointment"}>
        <form onSubmit={handleSaveAppt} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="appt-date">Date</Label>
            <Input id="appt-date" type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Note <span className="text-foreground/40 font-normal">(optional)</span></p>
            <textarea
              value={apptNotes}
              onChange={(e) => setApptNotes(e.target.value)}
              placeholder="e.g. 4-month checkup, ask about vaccines"
              rows={3}
              className="block w-full rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
          <Button type="submit" loading={apptLoading} className="w-full !py-3">
            {editingApptId ? "Update appointment" : "Save appointment"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
