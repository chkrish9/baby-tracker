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
      {/* A genuine <table> (not a div styled with display:table) with one row of three
          cells, all vertical-align:middle: icon, title text, baby info. table/vertical-align
          rather than flex because html2canvas's flexbox support doesn't honor cross-axis
          centering or equal-height stretching, which left the icon misaligned and the two
          header halves at different heights in exported PDFs. A real <table>/<tr>/<td>
          structure (rather than CSS display:table divs, which rely on browsers silently
          synthesizing an anonymous row) renders more precisely in html2canvas. */}
      <table className="w-full border-collapse pb-4 border-b-2 border-black">
        <tbody>
          <tr>
            <td className="align-middle pr-3" style={{ width: "1%" }}>
              {/* Inlined rather than <img src="/logo.svg">: html2canvas rasterizes external
                  SVG images unreliably and was clipping the icon in exported PDFs. A small
                  top margin compensates for the text column's line-height "leading" (the
                  invisible space CSS reserves above/below glyphs, which the icon has none
                  of) — without it, vertical-align:middle centers the icon against the
                  text's full line box rather than its visible glyphs, reading as too high. */}
              <svg width={64} height={64} viewBox="0 0 512 512" className="block" style={{ marginTop: "10px" }}>
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
            <td className="align-middle whitespace-nowrap" style={{ width: "1%" }}>
              {/* leading-tight on both lines: default line-height adds invisible space
                  above/below the glyphs (typographic "leading"). The icon has no such
                  padding, so with normal leading the text's CSS-computed vertical center
                  (which includes that invisible space) sits visibly lower than the icon's
                  true center even though the cell itself is correctly vertical-align:middle. */}
              <p className="text-xs font-semibold uppercase tracking-widest text-black/50 leading-tight">Little Notes</p>
              <h1 className="text-xl font-bold leading-tight">Doctor Visit Preparation</h1>
            </td>
            <td className="align-middle text-right text-sm pl-4">
              <p className="text-lg font-bold">{babyDisplayName(baby)}</p>
              <p className="text-black/60">DOB: {formatDate(baby.birthDate)}</p>
              <p className="text-black/60">Age: {fullAgeBreakdown(baby.birthDate)}</p>
              <p className="text-black/60">
                Appointment: {appointmentDate ? formatDate(appointmentDate) : "No appointment scheduled"}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </PrintSection>
  );
}
