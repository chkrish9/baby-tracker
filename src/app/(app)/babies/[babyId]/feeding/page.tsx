"use client";
import { use, useEffect, useState } from "react";
import { mutate } from "swr";
import { useFeedings } from "@/hooks/useFeeding";
import { useDiapers } from "@/hooks/useDiapers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

const FEED_TYPES = [
  { value: "BOTTLE", label: "Bottle" },
  { value: "BREAST_LEFT", label: "Breast (L)" },
  { value: "BREAST_RIGHT", label: "Breast (R)" },
  { value: "SOLID", label: "Solid" },
];

const DIAPER_TYPES = [
  { value: "WET", label: "Wet" },
  { value: "DIRTY", label: "Dirty" },
  { value: "BOTH", label: "Mixed" },
];

const FEED_LABELS: Record<string, string> = {
  BREAST_LEFT: "Breast (L)", BREAST_RIGHT: "Breast (R)", BOTTLE: "Bottle", SOLID: "Solid"
};

const DIAPER_LABELS: Record<string, string> = {
  WET: "Wet", DIRTY: "Dirty", BOTH: "Mixed", DRY: "Dry"
};

const AMOUNT_UNITS = [
  { value: "ml", label: "ml" },
  { value: "oz", label: "oz" },
];

const DURATION_UNITS = [
  { value: "min", label: "min" },
  { value: "hr", label: "hr" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function timeAgo(iso: string) {
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSec < 60) return "just now";
  const totalMin = Math.floor(diffSec / 60);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return `${parts.join(" ")} ago`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function nowDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTimeStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combineDateTime(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
}

function splitDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString();
  const yest = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return "TODAY";
  if (d.toDateString() === yest) return "YESTERDAY";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
}

function BottleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h6M7 2v2.5C5.5 5.5 4 7 4 9.5v5a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0014 14.5v-5C14 7 12.5 5.5 11 4.5V2" />
    </svg>
  );
}

function DiaperIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6h14v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      <path d="M2 6c2 0 4 2 7 2s5-2 7-2" />
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

function FlagIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v12" />
      <path d="M4 2.5h7l-1.5 2.5L11 7.5H4" />
    </svg>
  );
}

interface FeedingLog { id: string; type: string; amount?: number | null; duration?: number | null; unit?: string | null; notes?: string | null; loggedAt: string; }
interface DiaperLog { id: string; type: string; notes?: string | null; flagged?: boolean; loggedAt: string; }

export default function LogsPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { toast } = useToast();

  const [tab, setTab] = useState<"feeding" | "diaper">("feeding");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "diaper") setTab("diaper");
  }, []);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showDiaperModal, setShowDiaperModal] = useState(false);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editingDiaperId, setEditingDiaperId] = useState<string | null>(null);

  // Feeding form state
  const [feedType, setFeedType] = useState("BOTTLE");
  const [feedAmount, setFeedAmount] = useState("");
  const [feedDuration, setFeedDuration] = useState("");
  const [feedAmountUnit, setFeedAmountUnit] = useState("ml");
  const [feedDurationUnit, setFeedDurationUnit] = useState("min");
  const [feedNotes, setFeedNotes] = useState("");
  const [feedDate, setFeedDate] = useState(nowDateStr);
  const [feedTime, setFeedTime] = useState(nowTimeStr);
  const [feedLoading, setFeedLoading] = useState(false);

  // Diaper form state
  const [diaperType, setDiaperType] = useState("WET");
  const [diaperNotes, setDiaperNotes] = useState("");
  const [diaperDate, setDiaperDate] = useState(nowDateStr);
  const [diaperTime, setDiaperTime] = useState(nowTimeStr);
  const [diaperLoading, setDiaperLoading] = useState(false);

  const { data: feedings, isLoading: feedLoading2 } = useFeedings(babyId);
  const { data: diapers, isLoading: diaperLoading2 } = useDiapers(babyId);

  async function handleDeleteFeed(logId: string) {
    const res = await fetch(`/api/babies/${babyId}/feeding/${logId}`, { method: "DELETE" });
    if (res.ok) { mutate(`/api/babies/${babyId}/feeding`); toast("Entry deleted", "success"); }
    else toast("Failed to delete", "error");
  }

  async function handleDeleteDiaper(logId: string) {
    const res = await fetch(`/api/babies/${babyId}/diapers/${logId}`, { method: "DELETE" });
    if (res.ok) { mutate(`/api/babies/${babyId}/diapers`); toast("Entry deleted", "success"); }
    else toast("Failed to delete", "error");
  }

  async function handleToggleFlagDiaper(log: DiaperLog) {
    const res = await fetch(`/api/babies/${babyId}/diapers/${log.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged: !log.flagged }),
    });
    if (res.ok) {
      mutate(`/api/babies/${babyId}/diapers`);
      toast(log.flagged ? "Unflagged" : "Flagged for the doctor", "success");
    } else toast("Failed to update", "error");
  }

  function handleEditFeed(log: FeedingLog) {
    setEditingFeedId(log.id);
    setFeedType(log.type);
    setFeedAmount(log.amount != null ? String(log.amount) : "");
    setFeedDuration(log.duration != null ? String(log.duration) : "");
    setFeedAmountUnit(log.amount != null ? (log.unit ?? "ml") : "ml");
    setFeedDurationUnit(log.duration != null ? (log.unit ?? "min") : "min");
    setFeedNotes(log.notes ?? "");
    const { date, time } = splitDateTime(log.loggedAt);
    setFeedDate(date); setFeedTime(time);
    setShowFeedModal(true);
  }

  function handleEditDiaper(log: DiaperLog) {
    setEditingDiaperId(log.id);
    setDiaperType(log.type);
    setDiaperNotes(log.notes ?? "");
    const { date, time } = splitDateTime(log.loggedAt);
    setDiaperDate(date); setDiaperTime(time);
    setShowDiaperModal(true);
  }

  async function handleLogFeed(e: React.FormEvent) {
    e.preventDefault();
    setFeedLoading(true);
    const body: Record<string, unknown> = { type: feedType, amount: null, duration: null, unit: null };
    const showAmount = feedType === "BOTTLE" || feedType === "SOLID";
    const showDuration = feedType === "BREAST_LEFT" || feedType === "BREAST_RIGHT";
    if (showAmount && feedAmount) { body.amount = parseFloat(feedAmount); body.unit = feedAmountUnit; }
    if (showDuration && feedDuration) { body.duration = parseFloat(feedDuration); body.unit = feedDurationUnit; }
    body.notes = feedNotes || null;
    body.loggedAt = combineDateTime(feedDate, feedTime);
    const url = editingFeedId ? `/api/babies/${babyId}/feeding/${editingFeedId}` : `/api/babies/${babyId}/feeding`;
    const res = await fetch(url, { method: editingFeedId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setFeedLoading(false);
    if (!res.ok) { toast("Failed to log", "error"); return; }
    await mutate(`/api/babies/${babyId}/feeding`);
    await mutate(`/api/babies/${babyId}`);
    toast(editingFeedId ? "Feeding updated!" : "Feeding logged!", "success");
    setShowFeedModal(false);
    setEditingFeedId(null);
    setFeedAmount(""); setFeedDuration(""); setFeedNotes(""); setFeedType("BOTTLE");
    setFeedDate(nowDateStr()); setFeedTime(nowTimeStr());
  }

  async function handleLogDiaper(e: React.FormEvent) {
    e.preventDefault();
    setDiaperLoading(true);
    const body: Record<string, unknown> = { type: diaperType };
    body.notes = diaperNotes || null;
    body.loggedAt = combineDateTime(diaperDate, diaperTime);
    const url = editingDiaperId ? `/api/babies/${babyId}/diapers/${editingDiaperId}` : `/api/babies/${babyId}/diapers`;
    const res = await fetch(url, { method: editingDiaperId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setDiaperLoading(false);
    if (!res.ok) { toast("Failed to log", "error"); return; }
    await mutate(`/api/babies/${babyId}/diapers`);
    await mutate(`/api/babies/${babyId}`);
    toast(editingDiaperId ? "Diaper updated!" : "Diaper logged!", "success");
    setShowDiaperModal(false);
    setEditingDiaperId(null);
    setDiaperNotes(""); setDiaperType("WET");
    setDiaperDate(nowDateStr()); setDiaperTime(nowTimeStr());
  }

  // Group logs by day
  function groupByDay<T extends { loggedAt: string }>(logs: T[]) {
    const groups: { label: string; items: T[] }[] = [];
    const seen = new Map<string, number>();
    for (const item of logs) {
      const key = new Date(item.loggedAt).toDateString();
      const label = dayLabel(item.loggedAt);
      if (!seen.has(key)) {
        seen.set(key, groups.length);
        groups.push({ label, items: [item] });
      } else {
        groups[seen.get(key)!].items.push(item);
      }
    }
    return groups;
  }

  const feedGroups = groupByDay<FeedingLog>(feedings ?? []);
  const diaperGroups = groupByDay<DiaperLog>(diapers ?? []);
  const isLoading = tab === "feeding" ? feedLoading2 : diaperLoading2;
  const isEmpty = tab === "feeding" ? !feedings?.length : !diapers?.length;

  return (
    <div className="max-w-lg mx-auto">
      {/* Tab switcher */}
      <div className="px-4 pt-4">
        <div className="flex bg-pink-50 rounded-2xl p-1">
          <button
            onClick={() => setTab("feeding")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === "feeding" ? "bg-white text-foreground shadow-sm" : "text-foreground/40"}`}
          >
            Feeding
          </button>
          <button
            onClick={() => setTab("diaper")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === "diaper" ? "bg-white text-foreground shadow-sm" : "text-foreground/40"}`}
          >
            Diaper
          </button>
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground font-serif">
          {tab === "feeding" ? "Feedings" : "Diapers"}
        </h1>
        <Button
          size="sm"
          onClick={() => {
            if (tab === "feeding") {
              setEditingFeedId(null);
              setFeedAmount(""); setFeedDuration(""); setFeedNotes(""); setFeedType("BOTTLE");
              setFeedDate(nowDateStr()); setFeedTime(nowTimeStr());
              setShowFeedModal(true);
            } else {
              setEditingDiaperId(null);
              setDiaperNotes(""); setDiaperType("WET");
              setDiaperDate(nowDateStr()); setDiaperTime(nowTimeStr());
              setShowDiaperModal(true);
            }
          }}
        >
          + {tab === "feeding" ? "Log feed" : "Log diaper"}
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!isLoading && isEmpty && (
        <div className="text-center py-16 text-foreground/30">
          <div className="flex justify-center mb-3">
            {tab === "feeding" ? <BottleIcon /> : <DiaperIcon />}
          </div>
          <p className="text-sm">No {tab === "feeding" ? "feedings" : "diaper changes"} yet</p>
        </div>
      )}

      <div className="px-4 pb-6 space-y-4">
        {tab === "feeding" && feedGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-foreground/40 tracking-widest mb-2 px-1">{group.label}</p>
            <div className="space-y-2">
              {group.items.map((log) => (
                <div key={log.id} className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-pink-50 text-pink-400 flex-shrink-0">
                    <BottleIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{FEED_LABELS[log.type] ?? log.type}</p>
                    <p className="text-xs text-foreground/50 truncate">
                      {[log.amount && `${log.amount} ${log.unit ?? "ml"}`, log.duration && `${log.duration} ${log.unit ?? "min"}`, log.notes].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className="text-sm font-medium text-foreground">{formatTime(log.loggedAt)}</p>
                    <p className="text-xs text-foreground/40">{timeAgo(log.loggedAt)}</p>
                  </div>
                  <button onClick={() => handleEditFeed(log)} className="text-foreground/20 hover:text-foreground/60 transition-colors flex-shrink-0">
                    <EditIcon />
                  </button>
                  <button onClick={() => handleDeleteFeed(log.id)} className="text-foreground/20 hover:text-red-400 transition-colors flex-shrink-0">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {tab === "diaper" && diaperGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-foreground/40 tracking-widest mb-2 px-1">{group.label}</p>
            <div className="space-y-2">
              {group.items.map((log) => (
                <div key={log.id} className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${log.type === "WET" ? "bg-sky-100 text-sky-500" : log.type === "DIRTY" ? "bg-amber-50 text-amber-500" : "bg-pink-50 text-pink-400"}`}>
                    <DiaperIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm flex items-center gap-1.5">
                      {DIAPER_LABELS[log.type] ?? log.type}
                      {log.flagged && <span className="text-pink-500"><FlagIcon filled /></span>}
                    </p>
                    <p className="text-xs text-foreground/50 truncate">{log.notes ?? "No note"}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className="text-sm font-medium text-foreground">{formatTime(log.loggedAt)}</p>
                    <p className="text-xs text-foreground/40">{timeAgo(log.loggedAt)}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFlagDiaper(log)}
                    className={`transition-colors flex-shrink-0 ${log.flagged ? "text-pink-500 hover:text-pink-600" : "text-foreground/20 hover:text-foreground/60"}`}
                    aria-label={log.flagged ? "Unflag for the doctor" : "Flag for the doctor"}
                  >
                    <FlagIcon filled={log.flagged} />
                  </button>
                  <button onClick={() => handleEditDiaper(log)} className="text-foreground/20 hover:text-foreground/60 transition-colors flex-shrink-0">
                    <EditIcon />
                  </button>
                  <button onClick={() => handleDeleteDiaper(log.id)} className="text-foreground/20 hover:text-red-400 transition-colors flex-shrink-0">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Log feeding modal */}
      <Modal open={showFeedModal} onClose={() => { setShowFeedModal(false); setEditingFeedId(null); }} title={editingFeedId ? "Edit feeding" : "Log a feeding"}>
        <form onSubmit={handleLogFeed} className="space-y-4 mt-2">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Type</p>
            <div className="flex gap-2">
              {FEED_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setFeedType(t.value)}
                  className={`flex-1 py-2 rounded-2xl border text-sm font-medium transition-all ${feedType === t.value ? "border-pink-400 bg-pink-50 text-pink-700" : "border-pink-100 text-foreground/60"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {(feedType === "BOTTLE" || feedType === "SOLID") && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Amount</p>
              <div className="flex gap-2">
                <Input type="number" min="0" step="0.1" value={feedAmount} onChange={(e) => setFeedAmount(e.target.value)} placeholder="e.g. 120" className="flex-1" />
                <select
                  value={feedAmountUnit}
                  onChange={(e) => setFeedAmountUnit(e.target.value)}
                  className="flex-1 rounded-2xl border border-pink-100 bg-white px-3 py-2.5 text-sm text-foreground focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  {AMOUNT_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
          )}
          {(feedType === "BREAST_LEFT" || feedType === "BREAST_RIGHT") && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Duration</p>
              <div className="flex gap-2">
                <Input type="number" min="0" step="any" value={feedDuration} onChange={(e) => setFeedDuration(e.target.value)} placeholder="e.g. 15" className="flex-1" />
                <select
                  value={feedDurationUnit}
                  onChange={(e) => setFeedDurationUnit(e.target.value)}
                  className="flex-1 rounded-2xl border border-pink-100 bg-white px-3 py-2.5 text-sm text-foreground focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  {DURATION_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">Date</p>
              <Input type="date" value={feedDate} onChange={(e) => setFeedDate(e.target.value)} required />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">Time</p>
              <Input type="time" value={feedTime} onChange={(e) => setFeedTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Note <span className="text-foreground/40 font-normal">(optional)</span></p>
            <textarea
              value={feedNotes}
              onChange={(e) => setFeedNotes(e.target.value)}
              placeholder="How did it go?"
              rows={3}
              className="block w-full rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
          <Button type="submit" loading={feedLoading} className="w-full !py-3">{editingFeedId ? "Update feeding" : "Save feeding"}</Button>
        </form>
      </Modal>

      {/* Log diaper modal */}
      <Modal open={showDiaperModal} onClose={() => { setShowDiaperModal(false); setEditingDiaperId(null); }} title={editingDiaperId ? "Edit diaper change" : "Log a diaper change"}>
        <form onSubmit={handleLogDiaper} className="space-y-4 mt-2">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Type</p>
            <div className="flex gap-2">
              {DIAPER_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setDiaperType(t.value)}
                  className={`flex-1 py-2 rounded-2xl border text-sm font-medium transition-all ${diaperType === t.value ? "border-pink-400 bg-pink-50 text-pink-700" : "border-pink-100 text-foreground/60"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">Date</p>
              <Input type="date" value={diaperDate} onChange={(e) => setDiaperDate(e.target.value)} required />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-2">Time</p>
              <Input type="time" value={diaperTime} onChange={(e) => setDiaperTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Note <span className="text-foreground/40 font-normal">(optional)</span></p>
            <textarea
              value={diaperNotes}
              onChange={(e) => setDiaperNotes(e.target.value)}
              placeholder="Colour, consistency, anything unusual..."
              rows={3}
              className="block w-full rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
          <Button type="submit" loading={diaperLoading} className="w-full !py-3">{editingDiaperId ? "Update diaper" : "Save diaper"}</Button>
        </form>
      </Modal>
    </div>
  );
}
