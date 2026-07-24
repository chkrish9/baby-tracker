"use client";
import { useBaby } from "@/hooks/useBaby";
import { babyDisplayName } from "@/lib/utils";
import { PrintSection } from "./PrintSection";

interface DoctorVisitReportHeaderProps {
  babyId: string;
  appointmentDate: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fullAgeBreakdown(birthDateIso: string): string {
  const birth = new Date(birthDateIso);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const weeks = Math.floor(days / 7);
  const remDays = days % 7;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (remDays > 0 || parts.length === 0) parts.push(`${remDays}d`);
  return parts.join(" ");
}

export function DoctorVisitReportHeader({ babyId, appointmentDate }: DoctorVisitReportHeaderProps) {
  const { data: baby } = useBaby(babyId);

  if (!baby) return null;

  return (
    <PrintSection>
      {/* Flex for the left/right split (main-axis distribution via justify-between is
          fine in html2canvas). No items-center here — cross-axis centering isn't
          reliable in html2canvas's flexbox support, which is exactly what caused the
          original icon-misalignment bug. Instead this relies on flex's default
          align-items: stretch, which makes both columns the row's full height (matching
          the taller right column) without invoking that buggy centering path. The inner
          table (h-full so it actually fills that stretched height) then centers the
          icon+title against each other within it via plain vertical-align:middle. */}
      <div className="flex justify-between gap-4 pb-4 border-b-2 border-black">
        <table className="border-collapse h-full">
          <tbody>
            <tr>
              <td className="align-middle pr-3">
                {/* Inlined rather than <img src="/logo.svg">: html2canvas rasterizes external
                    SVG images unreliably and was clipping the icon in exported PDFs. */}
                <svg width={64} height={64} viewBox="0 0 512 512" className="block">
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
              </td>
              <td className="align-middle whitespace-nowrap">
                {/* leading-tight shrinks the line-height "leading" (invisible space CSS
                    reserves above/below glyphs, which the icon has none of) so the visible
                    text sits closer to the cell's true vertical-align:middle center. The
                    remaining gap is a plain visual nudge via transform (doesn't affect
                    layout/centering math, so — unlike moving the icon — there's no clipping
                    risk even though this cell has less slack than the icon's). */}
                <div style={{ transform: "translateY(-10px)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-black/50 leading-tight">Little Notes</p>
                  <h1 className="text-xl font-bold leading-tight">Doctor Visit Preparation</h1>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="text-right text-sm">
          <p className="text-lg font-bold">{babyDisplayName(baby)}</p>
          <p className="text-black/60">DOB: {formatDate(baby.birthDate)}</p>
          <p className="text-black/60">Age: {fullAgeBreakdown(baby.birthDate)}</p>
          <p className="text-black/60">
            Appointment: {appointmentDate ? formatDate(appointmentDate) : "No appointment scheduled"}
          </p>
        </div>
      </div>
    </PrintSection>
  );
}
