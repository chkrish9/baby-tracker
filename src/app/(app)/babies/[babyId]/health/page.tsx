"use client";
import { use, useMemo, useState } from "react";
import { mutate } from "swr";
import { useBaby } from "@/hooks/useBaby";
import { useVaccinations, useGrowthRecords, useHealthRecords } from "@/hooks/useHealth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { GrowthLineChart } from "@/components/charts/GrowthLineChart";
import { toGrowthPoints } from "@/lib/charts";

type Tab = "vaccinations" | "weight" | "height" | "other";
type GrowthType = "WEIGHT" | "HEIGHT";

interface Vaccination { id: string; name: string; date: string; notes?: string | null; }
interface GrowthRecord { id: string; type: GrowthType; value: number; unit: string; recordedAt: string; notes?: string | null; }
interface HealthRecordItem { id: string; title: string; date: string; notes?: string | null; }

const WEIGHT_UNITS = [{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }];
const HEIGHT_UNITS = [{ value: "cm", label: "cm" }, { value: "in", label: "in" }];

function pad(n: number) { return n.toString().padStart(2, "0"); }

function nowDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function VaccineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2l5 5-2 2-1-1-2 2 1.5 1.5-2 2L9 12l-2 2-3.5-3.5 2-2L7 10l2-2-1.5-1.5 2-2 1 1 2-2z" />
      <path d="M2 16l2.5-2.5" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5v4l2.5 2.5" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="8" rx="1.5" />
      <path d="M5 5v2.5M8 5v2.5M11 5v2.5M14 5v2.5" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="12" height="14" rx="1.5" />
      <path d="M6 6h6M6 9h6M6 12h3" />
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

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V2.5h4V4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
    </svg>
  );
}

const TABS: { value: Tab; label: string }[] = [
  { value: "vaccinations", label: "Vaccines" },
  { value: "weight", label: "Weight" },
  { value: "height", label: "Height" },
  { value: "other", label: "Other" },
];

export default function HealthPage({ params }: { params: Promise<{ babyId: string }> }) {
  const { babyId } = use(params);
  const { data: baby } = useBaby(babyId);
  const { data: vaccinations, isLoading: vaccLoading } = useVaccinations(babyId);
  const { data: weightRecords, isLoading: weightLoading } = useGrowthRecords(babyId, "WEIGHT");
  const { data: heightRecords, isLoading: heightLoading } = useGrowthRecords(babyId, "HEIGHT");
  const { data: healthRecords, isLoading: otherLoading } = useHealthRecords(babyId);
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("vaccinations");

  // Vaccination modal state
  const [showVaccModal, setShowVaccModal] = useState(false);
  const [editingVaccId, setEditingVaccId] = useState<string | null>(null);
  const [vaccName, setVaccName] = useState("");
  const [vaccDate, setVaccDate] = useState(nowDateStr());
  const [vaccNotes, setVaccNotes] = useState("");
  const [vaccSaving, setVaccSaving] = useState(false);

  // Growth (weight/height) modal state
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [editingGrowthId, setEditingGrowthId] = useState<string | null>(null);
  const [growthValue, setGrowthValue] = useState("");
  const [growthUnit, setGrowthUnit] = useState("kg");
  const [growthDate, setGrowthDate] = useState(nowDateStr());
  const [growthNotes, setGrowthNotes] = useState("");
  const [growthSaving, setGrowthSaving] = useState(false);

  // Other health record modal state
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [editingOtherId, setEditingOtherId] = useState<string | null>(null);
  const [otherTitle, setOtherTitle] = useState("");
  const [otherDate, setOtherDate] = useState(nowDateStr());
  const [otherNotes, setOtherNotes] = useState("");
  const [otherSaving, setOtherSaving] = useState(false);

  const weightPoints = useMemo(() => toGrowthPoints(weightRecords ?? []), [weightRecords]);
  const heightPoints = useMemo(() => toGrowthPoints(heightRecords ?? []), [heightRecords]);
  const latestWeightUnit = weightRecords?.[0]?.unit ?? "kg";
  const latestHeightUnit = heightRecords?.[0]?.unit ?? "cm";

  function openAddVacc() {
    setEditingVaccId(null);
    setVaccName(""); setVaccDate(nowDateStr()); setVaccNotes("");
    setShowVaccModal(true);
  }

  function openEditVacc(v: Vaccination) {
    setEditingVaccId(v.id);
    setVaccName(v.name); setVaccDate(toDateInputValue(v.date)); setVaccNotes(v.notes ?? "");
    setShowVaccModal(true);
  }

  async function handleSaveVacc(e: React.FormEvent) {
    e.preventDefault();
    if (!vaccName.trim() || !vaccDate) return;
    setVaccSaving(true);
    const body = { name: vaccName.trim(), date: new Date(`${vaccDate}T00:00:00`).toISOString(), notes: vaccNotes || null };
    const url = editingVaccId ? `/api/babies/${babyId}/vaccinations/${editingVaccId}` : `/api/babies/${babyId}/vaccinations`;
    const res = await fetch(url, { method: editingVaccId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setVaccSaving(false);
    if (!res.ok) { toast("Failed to save vaccination", "error"); return; }
    await mutate(`/api/babies/${babyId}/vaccinations`);
    toast(editingVaccId ? "Vaccination updated!" : "Vaccination added!", "success");
    setShowVaccModal(false);
  }

  async function handleDeleteVacc(id: string) {
    const res = await fetch(`/api/babies/${babyId}/vaccinations/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(`/api/babies/${babyId}/vaccinations`); toast("Vaccination removed", "success"); }
    else toast("Failed to delete", "error");
  }

  function openAddGrowth() {
    setEditingGrowthId(null);
    setGrowthValue("");
    setGrowthUnit(tab === "height" ? "cm" : "kg");
    setGrowthDate(nowDateStr());
    setGrowthNotes("");
    setShowGrowthModal(true);
  }

  function openEditGrowth(r: GrowthRecord) {
    setEditingGrowthId(r.id);
    setGrowthValue(String(r.value));
    setGrowthUnit(r.unit);
    setGrowthDate(toDateInputValue(r.recordedAt));
    setGrowthNotes(r.notes ?? "");
    setShowGrowthModal(true);
  }

  async function handleSaveGrowth(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(growthValue);
    if (!Number.isFinite(value) || value <= 0 || !growthDate) return;
    setGrowthSaving(true);
    const growthType: GrowthType = tab === "height" ? "HEIGHT" : "WEIGHT";
    const body = {
      type: growthType,
      value,
      unit: growthUnit,
      recordedAt: new Date(`${growthDate}T00:00:00`).toISOString(),
      notes: growthNotes || null,
    };
    const url = editingGrowthId ? `/api/babies/${babyId}/growth/${editingGrowthId}` : `/api/babies/${babyId}/growth`;
    const res = await fetch(url, { method: editingGrowthId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setGrowthSaving(false);
    if (!res.ok) { toast(`Failed to save ${tab}`, "error"); return; }
    await mutate(`/api/babies/${babyId}/growth?type=${growthType}`);
    toast(editingGrowthId ? "Record updated!" : "Record added!", "success");
    setShowGrowthModal(false);
  }

  async function handleDeleteGrowth(id: string, growthType: GrowthType) {
    const res = await fetch(`/api/babies/${babyId}/growth/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(`/api/babies/${babyId}/growth?type=${growthType}`); toast("Record removed", "success"); }
    else toast("Failed to delete", "error");
  }

  function openAddOther() {
    setEditingOtherId(null);
    setOtherTitle(""); setOtherDate(nowDateStr()); setOtherNotes("");
    setShowOtherModal(true);
  }

  function openEditOther(r: HealthRecordItem) {
    setEditingOtherId(r.id);
    setOtherTitle(r.title); setOtherDate(toDateInputValue(r.date)); setOtherNotes(r.notes ?? "");
    setShowOtherModal(true);
  }

  async function handleSaveOther(e: React.FormEvent) {
    e.preventDefault();
    if (!otherTitle.trim() || !otherDate) return;
    setOtherSaving(true);
    const body = { title: otherTitle.trim(), date: new Date(`${otherDate}T00:00:00`).toISOString(), notes: otherNotes || null };
    const url = editingOtherId ? `/api/babies/${babyId}/health-records/${editingOtherId}` : `/api/babies/${babyId}/health-records`;
    const res = await fetch(url, { method: editingOtherId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setOtherSaving(false);
    if (!res.ok) { toast("Failed to save record", "error"); return; }
    await mutate(`/api/babies/${babyId}/health-records`);
    toast(editingOtherId ? "Record updated!" : "Record added!", "success");
    setShowOtherModal(false);
  }

  async function handleDeleteOther(id: string) {
    const res = await fetch(`/api/babies/${babyId}/health-records/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(`/api/babies/${babyId}/health-records`); toast("Record removed", "success"); }
    else toast("Failed to delete", "error");
  }

  const isLoading =
    (tab === "vaccinations" && vaccLoading) ||
    (tab === "weight" && weightLoading) ||
    (tab === "height" && heightLoading) ||
    (tab === "other" && otherLoading);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold text-foreground font-serif">Health</h1>
      <p className="text-sm text-foreground/50 -mt-2">{baby?.name ?? "Your baby"}&apos;s vaccinations, growth, and other health details.</p>

      {/* Tab switcher */}
      <div className="flex bg-pink-50 rounded-2xl p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${tab === t.value ? "bg-white text-foreground shadow-sm" : "text-foreground/40"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!isLoading && tab === "vaccinations" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddVacc}>+ Add vaccination</Button>
          </div>
          {!vaccinations?.length ? (
            <p className="text-sm text-foreground/40 text-center py-8">No vaccinations logged yet</p>
          ) : (
            <div className="space-y-2">
              {vaccinations.map((v: Vaccination) => (
                <div key={v.id} className="flex items-start gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-pink-50 text-pink-400 flex-shrink-0">
                    <VaccineIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{v.name}</p>
                    <p className="text-xs text-foreground/50">{formatDate(v.date)}</p>
                    {v.notes && <p className="text-xs text-foreground/50 mt-0.5">{v.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditVacc(v)} className="p-1.5 text-foreground/40 hover:text-foreground/70 transition-colors" aria-label="Edit"><EditIcon /></button>
                    <button onClick={() => handleDeleteVacc(v.id)} className="p-1.5 text-foreground/40 hover:text-red-500 transition-colors" aria-label="Delete"><TrashIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && (tab === "weight" || tab === "height") && (
        <div className="space-y-3">
          <GrowthLineChart
            title={tab === "weight" ? "Weight" : "Height"}
            points={tab === "weight" ? weightPoints : heightPoints}
            unit={tab === "weight" ? latestWeightUnit : latestHeightUnit}
            emptyLabel={`No ${tab} logged yet`}
            color={tab === "weight" ? "#2a78d6" : "#1baf7a"}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddGrowth}>+ Log {tab}</Button>
          </div>
          {(tab === "weight" ? weightRecords : heightRecords)?.length ? (
            <div className="space-y-2">
              {(tab === "weight" ? weightRecords : heightRecords).map((r: GrowthRecord) => (
                <div key={r.id} className="flex items-start gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-50 text-sky-500 flex-shrink-0">
                    {tab === "weight" ? <ScaleIcon /> : <RulerIcon />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{r.value} {r.unit}</p>
                    <p className="text-xs text-foreground/50">{formatDate(r.recordedAt)}</p>
                    {r.notes && <p className="text-xs text-foreground/50 mt-0.5">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditGrowth(r)} className="p-1.5 text-foreground/40 hover:text-foreground/70 transition-colors" aria-label="Edit"><EditIcon /></button>
                    <button onClick={() => handleDeleteGrowth(r.id, r.type)} className="p-1.5 text-foreground/40 hover:text-red-500 transition-colors" aria-label="Delete"><TrashIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/40 text-center py-4">No {tab} entries yet</p>
          )}
        </div>
      )}

      {!isLoading && tab === "other" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAddOther}>+ Add record</Button>
          </div>
          {!healthRecords?.length ? (
            <p className="text-sm text-foreground/40 text-center py-8">No other health records yet</p>
          ) : (
            <div className="space-y-2">
              {healthRecords.map((r: HealthRecordItem) => (
                <div key={r.id} className="flex items-start gap-3 bg-white rounded-2xl border border-pink-100/60 p-3.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex-shrink-0">
                    <NoteIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{r.title}</p>
                    <p className="text-xs text-foreground/50">{formatDate(r.date)}</p>
                    {r.notes && <p className="text-xs text-foreground/50 mt-0.5">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditOther(r)} className="p-1.5 text-foreground/40 hover:text-foreground/70 transition-colors" aria-label="Edit"><EditIcon /></button>
                    <button onClick={() => handleDeleteOther(r.id)} className="p-1.5 text-foreground/40 hover:text-red-500 transition-colors" aria-label="Delete"><TrashIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vaccination modal */}
      <Modal open={showVaccModal} onClose={() => setShowVaccModal(false)} title={editingVaccId ? "Edit vaccination" : "Add vaccination"}>
        <form onSubmit={handleSaveVacc} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="vacc-name">Vaccine name</Label>
            <Input id="vacc-name" value={vaccName} onChange={(e) => setVaccName(e.target.value)} placeholder="e.g. DTaP, MMR" required />
          </div>
          <div>
            <Label htmlFor="vacc-date">Date</Label>
            <Input id="vacc-date" type="date" value={vaccDate} onChange={(e) => setVaccDate(e.target.value)} required />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Notes <span className="text-foreground/40 font-normal">(optional)</span></p>
            <textarea
              value={vaccNotes}
              onChange={(e) => setVaccNotes(e.target.value)}
              placeholder="e.g. mild fever after, given by Dr. Lee"
              rows={3}
              className="block w-full rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
          <Button type="submit" loading={vaccSaving} className="w-full !py-3">
            {editingVaccId ? "Update vaccination" : "Save vaccination"}
          </Button>
        </form>
      </Modal>

      {/* Growth (weight/height) modal */}
      <Modal open={showGrowthModal} onClose={() => setShowGrowthModal(false)} title={editingGrowthId ? `Edit ${tab}` : `Log ${tab}`}>
        <form onSubmit={handleSaveGrowth} className="space-y-4 mt-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="growth-value">Value</Label>
              <Input id="growth-value" type="number" step="0.01" min="0" value={growthValue} onChange={(e) => setGrowthValue(e.target.value)} required />
            </div>
            <div className="w-24">
              <Label htmlFor="growth-unit">Unit</Label>
              <select
                id="growth-unit"
                value={growthUnit}
                onChange={(e) => setGrowthUnit(e.target.value)}
                className="block w-full rounded-2xl border border-pink-100 bg-white px-3 py-2.5 text-sm text-foreground focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {(tab === "height" ? HEIGHT_UNITS : WEIGHT_UNITS).map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="growth-date">Date</Label>
            <Input id="growth-date" type="date" value={growthDate} onChange={(e) => setGrowthDate(e.target.value)} required />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Notes <span className="text-foreground/40 font-normal">(optional)</span></p>
            <textarea
              value={growthNotes}
              onChange={(e) => setGrowthNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
          <Button type="submit" loading={growthSaving} className="w-full !py-3">
            {editingGrowthId ? "Update" : "Save"}
          </Button>
        </form>
      </Modal>

      {/* Other health record modal */}
      <Modal open={showOtherModal} onClose={() => setShowOtherModal(false)} title={editingOtherId ? "Edit record" : "Add health record"}>
        <form onSubmit={handleSaveOther} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="other-title">Title</Label>
            <Input id="other-title" value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} placeholder="e.g. Allergy diagnosis" required />
          </div>
          <div>
            <Label htmlFor="other-date">Date</Label>
            <Input id="other-date" type="date" value={otherDate} onChange={(e) => setOtherDate(e.target.value)} required />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Notes <span className="text-foreground/40 font-normal">(optional)</span></p>
            <textarea
              value={otherNotes}
              onChange={(e) => setOtherNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
          <Button type="submit" loading={otherSaving} className="w-full !py-3">
            {editingOtherId ? "Update record" : "Save record"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
