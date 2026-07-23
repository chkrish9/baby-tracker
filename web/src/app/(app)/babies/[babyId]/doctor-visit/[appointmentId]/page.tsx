"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { VisitPrep } from "@/components/doctor-visit/VisitPrep";
import { apiFetch } from "@/lib/api-client";

const fetcher = (url: string) => apiFetch(url).then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); });

interface Appointment { id: string; date: string; notes?: string | null; }

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5a1.5 1.5 0 012.12 2.12l-7.5 7.5-3 .88.88-3 7.5-7.5z" />
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
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AppointmentDetailPage({ params }: { params: Promise<{ babyId: string; appointmentId: string }> }) {
  const { babyId, appointmentId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: appt, error, isLoading } = useSWR<Appointment>(`/api/babies/${babyId}/appointments/${appointmentId}`, fetcher);

  const [showEditModal, setShowEditModal] = useState(false);
  const [apptDate, setApptDate] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [apptLoading, setApptLoading] = useState(false);

  useEffect(() => {
    if (appt) {
      setApptDate(toDateInputValue(appt.date));
      setApptNotes(appt.notes ?? "");
    }
  }, [appt]);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  if (error || !appt) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 text-center">
        <p className="text-sm text-foreground/50 mb-4">Appointment not found.</p>
        <Link href={`/babies/${babyId}/doctor-visit`} className="text-sm font-medium text-foreground hover:underline">
          Back to doctor visit
        </Link>
      </div>
    );
  }

  async function handleSaveAppt(e: React.FormEvent) {
    e.preventDefault();
    if (!apptDate) return;
    setApptLoading(true);
    const body = { date: new Date(`${apptDate}T00:00:00`).toISOString(), notes: apptNotes || null };
    const res = await apiFetch(`/api/babies/${babyId}/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setApptLoading(false);
    if (!res.ok) { toast("Failed to save appointment", "error"); return; }
    await mutate(`/api/babies/${babyId}/appointments/${appointmentId}`);
    await mutate(`/api/babies/${babyId}/appointments`);
    toast("Appointment updated!", "success");
    setShowEditModal(false);
  }

  async function handleDeleteAppt() {
    const res = await apiFetch(`/api/babies/${babyId}/appointments/${appointmentId}`, { method: "DELETE" });
    if (!res.ok) { toast("Failed to delete", "error"); return; }
    await mutate(`/api/babies/${babyId}/appointments`);
    toast("Appointment removed", "success");
    router.push(`/babies/${babyId}/doctor-visit`);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link
          href={`/babies/${babyId}/doctor-visit`}
          className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-pink-100/60 text-foreground hover:bg-pink-50 transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-foreground font-serif">{relativeDayLabel(appt.date)}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-pink-100/60 p-4 mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{formatApptDate(appt.date)}</p>
          {appt.notes && <p className="text-sm text-foreground/50 mt-1">{appt.notes}</p>}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => setShowEditModal(true)} className="text-foreground/30 hover:text-foreground/60 transition-colors">
            <EditIcon />
          </button>
          <button onClick={handleDeleteAppt} className="text-foreground/30 hover:text-red-400 transition-colors">
            <TrashIcon />
          </button>
        </div>
      </div>

      <VisitPrep babyId={babyId} appointmentId={appointmentId} />

      {/* Edit appointment modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit appointment">
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
          <Button type="submit" loading={apptLoading} className="w-full !py-3">Update appointment</Button>
        </form>
      </Modal>
    </div>
  );
}
