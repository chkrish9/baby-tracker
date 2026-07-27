// Builds the HTML fed to expo-print for the doctor-visit PDF export. Mirrors
// web/src/components/doctor-visit/print/{DoctorVisitPrintReport,
// AppointmentPrintReport,ReportHeader,DoctorVisitReportHeader,
// PrintVisitPrepSection,PrintHealthSection}.tsx section-for-section, in the
// same order, rather than a simplified summary.
import { ChartDay, ChartSeries, GrowthPoint } from "@/components/charts/chartHelpers";
import { buildGrowthChartHtml, buildStackedBarChartHtml } from "./pdfCharts";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Mirrors DoctorVisitReportHeader.tsx's fullAgeBreakdown.
function fullAgeBreakdown(birthDateIso: string): string {
  const birth = new Date(birthDateIso);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
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

// Same "Little Notes" bottle logo as web's inlined <svg> in ReportHeader/DoctorVisitReportHeader.
function logoSvg(size: number): string {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="112" fill="#4A6741" />
      <g fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
        <path d="M226 138 Q226 102 256 102 Q286 102 286 138" />
        <rect x="206" y="138" width="100" height="30" rx="15" />
        <rect x="178" y="168" width="156" height="238" rx="48" />
        <line x1="194" y1="252" x2="222" y2="252" />
        <line x1="194" y1="300" x2="222" y2="300" />
        <line x1="194" y1="348" x2="222" y2="348" />
      </g>
    </svg>`;
}

function statBlock(value: string, label: string): string {
  return `<div class="stat-block"><p class="stat-value">${escapeHtml(value)}</p><p class="stat-label">${escapeHtml(label)}</p></div>`;
}

function sectionTitle(title: string): string {
  return `<h2 class="section-title">${escapeHtml(title)}</h2>`;
}

// ── VisitPrep (shared by both report variants) ─────────────────────────────

export interface QuestionRow {
  question: string;
  answered: boolean;
}
export interface FlaggedDiaperRow {
  label: string;
  notes?: string | null;
  dateLabel: string;
}
export interface FlaggedPhotoRow {
  dataUri: string | null;
  filename: string;
}

function visitPrepHtml(questions: QuestionRow[], flaggedPhotos: FlaggedPhotoRow[], flaggedDiapers: FlaggedDiaperRow[]): string {
  const questionsBody = !questions.length
    ? `<p class="muted">No questions recorded.</p>`
    : `<table class="data-table"><tbody>
        ${questions.map((q) => `<tr><td class="check-col">${q.answered ? "✓" : ""}</td><td>${escapeHtml(q.question)}</td></tr>`).join("")}
      </tbody></table>`;

  const photosBody = !flaggedPhotos.length
    ? `<p class="muted">No photos flagged.</p>`
    : `<div class="photo-grid">
        ${flaggedPhotos
          .filter((p) => p.dataUri)
          .map((p) => `<div class="photo-cell"><img src="${p.dataUri}" alt="${escapeHtml(p.filename)}" /></div>`)
          .join("")}
      </div>`;

  const diapersBody = !flaggedDiapers.length
    ? `<p class="muted">No diaper notes flagged.</p>`
    : `<table class="data-table">
        <thead><tr><th>Date</th><th>Type</th><th>Note</th></tr></thead>
        <tbody>
          ${flaggedDiapers
            .map((d) => `<tr><td>${escapeHtml(d.dateLabel)}</td><td>${escapeHtml(d.label)}</td><td>${escapeHtml(d.notes ?? "–")}</td></tr>`)
            .join("")}
        </tbody>
      </table>`;

  return `
    <section class="print-section">
      ${sectionTitle("Questions for the doctor")}
      ${questionsBody}
    </section>
    <section class="print-section">
      ${sectionTitle("Flagged photos")}
      ${photosBody}
    </section>
    <section class="print-section">
      ${sectionTitle("Flagged diaper notes")}
      ${diapersBody}
    </section>`;
}

// ── Full doctor-visit report (mirrors DoctorVisitPrintReport.tsx) ─────────

export interface VaccinationRow {
  date: string;
  name: string;
  notes?: string | null;
}
export interface HealthRecordRow {
  date: string;
  title: string;
  notes?: string | null;
}
export interface GrowthRecordRow {
  recordedAt: string;
  value: number;
  unit: string;
}

export interface DoctorVisitPdfData {
  babyName: string;
  birthDate: string;
  appointmentDate: string | null;
  feeds24h: number;
  diapers24h: number;
  chartRangeLabel: string;
  chartRangePhrase: string;
  averages: {
    diapersPerDay: string;
    bottlePerDay: string;
    breastLPerDay: string;
    breastRPerDay: string;
    breastTotalPerDay: string;
  };
  feedSeries: ChartSeries[];
  diaperSeries: ChartSeries[];
  feedChartData: ChartDay[];
  diaperChartData: ChartDay[];
  feedExtraColumns: { key: string; label: string; format: (day: ChartDay) => string }[];
  questions: QuestionRow[];
  flaggedDiapers: FlaggedDiaperRow[];
  flaggedPhotos: FlaggedPhotoRow[];
  vaccinations: VaccinationRow[];
  weightPoints: GrowthPoint[];
  heightPoints: GrowthPoint[];
  weightUnit: string;
  heightUnit: string;
  weightRecords: GrowthRecordRow[];
  heightRecords: GrowthRecordRow[];
  healthRecords: HealthRecordRow[];
}

function growthRecordTableHtml(records: GrowthRecordRow[], emptyLabel: string): string {
  if (!records.length) return `<p class="muted">${escapeHtml(emptyLabel)}</p>`;
  return `<table class="data-table">
      <thead><tr><th>Date</th><th>Value</th></tr></thead>
      <tbody>${records.map((r) => `<tr><td>${formatDate(r.recordedAt)}</td><td>${r.value} ${escapeHtml(r.unit)}</td></tr>`).join("")}</tbody>
    </table>`;
}

export function buildDoctorVisitPdfHtml(data: DoctorVisitPdfData): string {
  const headerHtml = `
    <div class="header-row">
      <table class="header-brand"><tbody><tr>
        <td class="brand-icon">${logoSvg(64)}</td>
        <td class="brand-text">
          <p class="brand-kicker">Little Notes</p>
          <h1 class="brand-title">Doctor Visit Preparation</h1>
        </td>
      </tr></tbody></table>
      <div class="header-baby">
        <p class="baby-name">${escapeHtml(data.babyName)}</p>
        <p class="muted">DOB: ${formatDate(data.birthDate)}</p>
        <p class="muted">Age: ${fullAgeBreakdown(data.birthDate)}</p>
        <p class="muted">Appointment: ${data.appointmentDate ? formatDate(data.appointmentDate) : "No appointment scheduled"}</p>
      </div>
    </div>`;

  const last24hHtml = `
    <section class="print-section">
      ${sectionTitle("Last 24 Hours")}
      <div class="stat-row">
        ${statBlock(String(data.feeds24h), "Feeds / 24h")}
        ${statBlock(String(data.diapers24h), "Diapers / 24h")}
      </div>
    </section>`;

  const averagesHtml = `
    <section class="print-section">
      ${sectionTitle(`Daily averages · ${data.chartRangeLabel}`)}
      <div class="stat-row">
        ${statBlock(data.averages.diapersPerDay, "Diapers / day")}
        ${statBlock(data.averages.bottlePerDay, "Bottle / day")}
        ${statBlock(data.averages.breastLPerDay, "Breast (L) / day")}
        ${statBlock(data.averages.breastRPerDay, "Breast (R) / day")}
        ${statBlock(data.averages.breastTotalPerDay, "Breast total (L+R) / day")}
      </div>
    </section>`;

  const trendsHtml = `
    <section class="print-section">
      ${sectionTitle(`Feeding & Diaper Trends · ${data.chartRangeLabel}`)}
      <div class="chart-columns">
        ${buildStackedBarChartHtml(
          "Feedings",
          data.feedSeries,
          data.feedChartData,
          data.chartRangeLabel,
          `No feedings logged ${data.chartRangePhrase}`,
          data.feedExtraColumns
        )}
        ${buildStackedBarChartHtml(
          "Diapers",
          data.diaperSeries,
          data.diaperChartData,
          data.chartRangeLabel,
          `No diaper changes logged ${data.chartRangePhrase}`
        )}
      </div>
    </section>`;

  const visitPrep = visitPrepHtml(data.questions, data.flaggedPhotos, data.flaggedDiapers);

  const vaccinationsBody = !data.vaccinations.length
    ? `<p class="muted">No vaccinations logged.</p>`
    : `<table class="data-table">
        <thead><tr><th>Date</th><th>Vaccine</th><th>Notes</th></tr></thead>
        <tbody>${data.vaccinations
          .map((v) => `<tr><td>${formatDate(v.date)}</td><td>${escapeHtml(v.name)}</td><td>${escapeHtml(v.notes ?? "–")}</td></tr>`)
          .join("")}</tbody>
      </table>`;

  const healthRecordsBody = !data.healthRecords.length
    ? `<p class="muted">No other health records.</p>`
    : `<table class="data-table">
        <thead><tr><th>Date</th><th>Title</th><th>Notes</th></tr></thead>
        <tbody>${data.healthRecords
          .map((r) => `<tr><td>${formatDate(r.date)}</td><td>${escapeHtml(r.title)}</td><td>${escapeHtml(r.notes ?? "–")}</td></tr>`)
          .join("")}</tbody>
      </table>`;

  const healthHtml = `
    <section class="print-section">${sectionTitle("Health Information")}</section>
    <section class="print-section">
      ${sectionTitle("Vaccination Details")}
      ${vaccinationsBody}
    </section>
    <section class="print-section">
      ${sectionTitle("Weight & Height")}
      <div class="chart-columns">
        ${buildGrowthChartHtml("Weight", data.weightPoints, data.weightUnit, "#2a78d6", "No weight logged yet")}
        ${buildGrowthChartHtml("Height", data.heightPoints, data.heightUnit, "#1baf7a", "No height logged yet")}
      </div>
      <div class="chart-columns">
        <div class="chart-block">${growthRecordTableHtml(data.weightRecords, "No weight entries yet.")}</div>
        <div class="chart-block">${growthRecordTableHtml(data.heightRecords, "No height entries yet.")}</div>
      </div>
    </section>
    <section class="print-section">
      ${sectionTitle("Other health records")}
      ${healthRecordsBody}
    </section>`;

  return wrapHtml(`${headerHtml}${last24hHtml}${averagesHtml}${trendsHtml}${visitPrep}${healthHtml}`);
}

// ── Single appointment report (mirrors AppointmentPrintReport.tsx) ────────

export interface AppointmentPdfData {
  babyName: string;
  ageLabel: string;
  weightLabel: string;
  heightLabel: string;
  appointmentDateLabel: string;
  appointmentNotes?: string | null;
  questions: QuestionRow[];
  flaggedDiapers: FlaggedDiaperRow[];
  flaggedPhotos: FlaggedPhotoRow[];
}

export function buildAppointmentPdfHtml(data: AppointmentPdfData): string {
  const headerHtml = `
    <div class="header-row">
      <table class="header-brand"><tbody><tr>
        <td class="brand-icon">${logoSvg(48)}</td>
        <td class="brand-text">
          <p class="brand-kicker">Little Notes</p>
          <h1 class="brand-title">Appointment Summary</h1>
          <p class="muted">${escapeHtml(data.appointmentDateLabel)}</p>
        </td>
      </tr></tbody></table>
      <div class="header-baby">
        <p class="baby-name">${escapeHtml(data.babyName)}</p>
        <p class="muted">${escapeHtml(data.ageLabel)}</p>
        <p class="muted">${escapeHtml(data.weightLabel)} · ${escapeHtml(data.heightLabel)}</p>
      </div>
    </div>`;

  const notesHtml = data.appointmentNotes
    ? `<section class="print-section">${sectionTitle("Notes")}<p class="notes-text">${escapeHtml(data.appointmentNotes)}</p></section>`
    : "";

  const visitPrep = visitPrepHtml(data.questions, data.flaggedPhotos, data.flaggedDiapers);

  return wrapHtml(`${headerHtml}${notesHtml}${visitPrep}`);
}

function wrapHtml(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #000; padding: 24px; }
  .header-row { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 16px; border-bottom: 2px solid #000; margin-bottom: 20px; }
  .header-brand { border-collapse: collapse; }
  .brand-icon { padding-right: 12px; vertical-align: middle; }
  .brand-text { vertical-align: middle; white-space: nowrap; }
  .brand-kicker { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #00000080; margin: 0; }
  .brand-title { font-size: 20px; font-weight: 700; margin: 2px 0; }
  .header-baby { text-align: right; font-size: 13px; }
  .baby-name { font-size: 17px; font-weight: 700; margin: 0; }
  .muted { color: #00000099; font-size: 13px; margin: 2px 0; }
  .print-section { margin-bottom: 24px; }
  .section-title { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; }
  .stat-row { display: flex; gap: 8px; }
  .stat-block { flex: 1; background: #fff; border: 1px solid #00000019; border-radius: 12px; padding: 12px; text-align: center; }
  .stat-value { font-size: 18px; font-weight: 700; margin: 0; }
  .stat-label { font-size: 10px; color: #00000066; margin: 4px 0 0; }
  .chart-columns { display: flex; gap: 16px; align-items: flex-start; }
  .chart-block { flex: 1; min-width: 0; }
  .chart-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .chart-header h3 { font-size: 13px; font-weight: 600; margin: 0; }
  .chart-latest { font-size: 11px; color: #00000066; }
  .empty { font-size: 13px; color: #00000066; text-align: center; padding: 24px 0; }
  .legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .legend-item { font-size: 11px; color: #00000099; display: inline-flex; align-items: center; gap: 4px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  .data-table th { text-align: left; font-weight: 700; padding: 3px 6px 3px 0; }
  .data-table th.num, .data-table td.num { text-align: right; }
  .data-table td { padding: 3px 6px 3px 0; border-top: 1px solid #f0f0ee; }
  .data-table .check-col { width: 20px; }
  .total-cell { font-weight: 600; }
  .photo-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .photo-cell { width: 100px; height: 100px; background: #f5f5f3; border: 1px solid #00000019; overflow: hidden; }
  .photo-cell img { width: 100%; height: 100%; object-fit: cover; }
  .notes-text { font-size: 13px; }
</style>
</head>
<body>
  ${body}
</body>
</html>`;
}
