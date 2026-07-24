"use client";
import { useBaby } from "@/hooks/useBaby";
import { useGrowthRecords } from "@/hooks/useHealth";
import { babyDisplayName, ageLabel } from "@/lib/utils";
import { PrintSection } from "./PrintSection";

interface GrowthRecord { value: number; unit: string; recordedAt: string; }

interface ReportHeaderProps {
  babyId: string;
  title: string;
  subtitle?: string;
}

export function ReportHeader({ babyId, title, subtitle }: ReportHeaderProps) {
  const { data: baby } = useBaby(babyId);
  const { data: weightRecords } = useGrowthRecords(babyId, "WEIGHT");
  const { data: heightRecords } = useGrowthRecords(babyId, "HEIGHT");

  const latestWeight: GrowthRecord | undefined = weightRecords?.[0];
  const latestHeight: GrowthRecord | undefined = heightRecords?.[0];

  if (!baby) return null;

  const weightLabel = latestWeight ? `${latestWeight.value} ${latestWeight.unit}` : "Weight not recorded";
  const heightLabel = latestHeight ? `${latestHeight.value} ${latestHeight.unit}` : "Height not recorded";

  return (
    <PrintSection>
      <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-black">
        <div className="table">
          {/* table/table-cell + align-middle rather than flex items-center: html2canvas's
              flexbox support doesn't honor cross-axis centering, which left the icon
              misaligned against the title text in exported PDFs. Table vertical-align
              is rendered reliably instead. */}
          <div className="table-cell align-middle pr-3">
            {/* Inlined rather than <img src="/logo.svg">: html2canvas rasterizes external
                SVG images unreliably and was clipping the icon in exported PDFs. */}
            <svg width={48} height={48} viewBox="0 0 512 512" className="block">
              <rect width="512" height="512" rx="112" fill="#4A6741" />
              <g fill="none" stroke="white" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
                <path d="M226 138 Q226 102 256 102 Q286 102 286 138" />
                <rect x="206" y="138" width="100" height="30" rx="15" />
                <rect x="178" y="168" width="156" height="238" rx="48" />
                <line x1="194" y1="252" x2="222" y2="252" />
                <line x1="194" y1="300" x2="222" y2="300" />
                <line x1="194" y1="348" x2="222" y2="348" />
              </g>
            </svg>
          </div>
          <div className="table-cell align-middle">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/50">Little Notes</p>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-black/60">{subtitle}</p>}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-lg font-bold">{babyDisplayName(baby)}</p>
          <p className="text-black/60">{ageLabel(baby.birthDate)}</p>
          <p className="text-black/60">{weightLabel} · {heightLabel}</p>
        </div>
      </div>
    </PrintSection>
  );
}
