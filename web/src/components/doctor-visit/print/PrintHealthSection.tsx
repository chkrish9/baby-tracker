"use client";
import { useMemo } from "react";
import { useVaccinations, useGrowthRecords, useHealthRecords } from "@/hooks/useHealth";
import { GrowthLineChart } from "@/components/charts/GrowthLineChart";
import { toGrowthPoints } from "@/lib/charts";
import { PrintSection } from "./PrintSection";

interface Vaccination { id: string; name: string; date: string; notes?: string | null; }
interface GrowthRecord { id: string; value: number; unit: string; recordedAt: string; notes?: string | null; }
interface HealthRecordItem { id: string; title: string; date: string; notes?: string | null; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function GrowthRecordTable({ records, emptyLabel }: { records: GrowthRecord[] | undefined; emptyLabel: string }) {
  if (!records?.length) return <p className="text-sm text-black/50">{emptyLabel}</p>;
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left">
          <th className="font-bold py-1 pr-2">Date</th>
          <th className="font-bold py-1">Value</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id}>
            <td className="py-1.5 pr-2 whitespace-nowrap">{formatDate(r.recordedAt)}</td>
            <td className="py-1.5">{r.value} {r.unit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface PrintHealthSectionProps {
  babyId: string;
}

export function PrintHealthSection({ babyId }: PrintHealthSectionProps) {
  const { data: vaccinations } = useVaccinations(babyId);
  const { data: weightRecords } = useGrowthRecords(babyId, "WEIGHT");
  const { data: heightRecords } = useGrowthRecords(babyId, "HEIGHT");
  const { data: healthRecords } = useHealthRecords(babyId);

  const weightPoints = useMemo(() => toGrowthPoints(weightRecords ?? []), [weightRecords]);
  const heightPoints = useMemo(() => toGrowthPoints(heightRecords ?? []), [heightRecords]);
  const latestWeightUnit = weightRecords?.[0]?.unit ?? "kg";
  const latestHeightUnit = heightRecords?.[0]?.unit ?? "cm";

  return (
    <>
      <PrintSection title="Health Information" />

      <PrintSection title="Vaccination Details">
        {!vaccinations?.length ? (
          <p className="text-sm text-black/50">No vaccinations logged.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left">
                <th className="font-bold py-1 pr-2">Date</th>
                <th className="font-bold py-1 pr-2">Vaccine</th>
                <th className="font-bold py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map((v: Vaccination) => (
                <tr key={v.id}>
                  <td className="py-1.5 pr-2 whitespace-nowrap">{formatDate(v.date)}</td>
                  <td className="py-1.5 pr-2">{v.name}</td>
                  <td className="py-1.5">{v.notes ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>

      <PrintSection title="Weight & Height">
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <GrowthLineChart title="Weight" points={weightPoints} unit={latestWeightUnit} emptyLabel="No weight logged yet" color="#2a78d6" />
          </div>
          <div className="flex-1 min-w-0">
            <GrowthLineChart title="Height" points={heightPoints} unit={latestHeightUnit} emptyLabel="No height logged yet" color="#1baf7a" />
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex-1 min-w-0">
            <GrowthRecordTable records={weightRecords} emptyLabel="No weight entries yet." />
          </div>
          <div className="flex-1 min-w-0">
            <GrowthRecordTable records={heightRecords} emptyLabel="No height entries yet." />
          </div>
        </div>
      </PrintSection>

      <PrintSection title="Other health records">
        {!healthRecords?.length ? (
          <p className="text-sm text-black/50">No other health records.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left">
                <th className="font-bold py-1 pr-2">Date</th>
                <th className="font-bold py-1 pr-2">Title</th>
                <th className="font-bold py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {healthRecords.map((r: HealthRecordItem) => (
                <tr key={r.id}>
                  <td className="py-1.5 pr-2 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="py-1.5 pr-2">{r.title}</td>
                  <td className="py-1.5">{r.notes ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>
    </>
  );
}
