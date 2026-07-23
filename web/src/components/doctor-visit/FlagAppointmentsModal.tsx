"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

interface Appointment { id: string; date: string; notes?: string | null; }

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

interface FlagAppointmentsModalProps {
  open: boolean;
  onClose: () => void;
  babyId: string;
  currentAppointmentIds: string[];
  onSave: (appointmentIds: string[]) => Promise<void>;
}

export function FlagAppointmentsModal({ open, onClose, babyId, currentAppointmentIds, onSave }: FlagAppointmentsModalProps) {
  const { data: appointments } = useSWR<Appointment[]>(open ? `/api/babies/${babyId}/appointments` : null, fetcher);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const currentIdsKey = currentAppointmentIds.join(",");
  useEffect(() => {
    if (open) setSelected(new Set(currentIdsKey ? currentIdsKey.split(",") : []));
  }, [open, currentIdsKey]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await onSave(Array.from(selected));
    setSaving(false);
    onClose();
  }

  const sorted = [...(appointments ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Modal open={open} onClose={onClose} title="Flag for appointment(s)">
      <div className="mt-2">
        {appointments && sorted.length === 0 ? (
          <p className="text-sm text-foreground/50 text-center py-4">
            No appointments yet. Add one from the Doctor Visit page to flag items for it.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sorted.map((appt) => (
              <label
                key={appt.id}
                className="flex items-center gap-3 bg-pink-50/50 hover:bg-pink-50 rounded-2xl p-3 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(appt.id)}
                  onChange={() => toggle(appt.id)}
                  className="w-4 h-4 rounded accent-pink-500 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{formatApptDate(appt.date)}</p>
                  {appt.notes && <p className="text-xs text-foreground/50 truncate">{appt.notes}</p>}
                </div>
              </label>
            ))}
          </div>
        )}
        <Button onClick={handleSave} loading={saving} className="w-full !py-3 mt-4">
          {selected.size === 0 ? "Unflag" : `Save (${selected.size} selected)`}
        </Button>
      </div>
    </Modal>
  );
}
