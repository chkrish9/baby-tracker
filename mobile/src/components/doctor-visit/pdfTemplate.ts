// Builds the HTML fed to expo-print for the doctor-visit PDF export. Mirrors
// the sections/data of web's print components (DoctorVisitPrintReport /
// AppointmentPrintReport) — real HTML/CSS for crisp text rather than a
// screenshot, since expo-print renders HTML natively into the PDF.

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

export interface VisitPdfData {
  babyName: string;
  generatedDate: string;
  stats?: { feeds24h: number; diapers24h: number };
  averages?: {
    rangeLabel: string;
    diapersPerDay: string;
    bottlePerDay: string;
    breastLPerDay: string;
    breastRPerDay: string;
    breastTotalPerDay: string;
  };
  appointments: { dateLabel: string; notes?: string | null }[];
  questions: QuestionRow[];
  flaggedDiapers: FlaggedDiaperRow[];
  flaggedPhotos: FlaggedPhotoRow[];
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function statTile(value: string | number, label: string): string {
  return `
    <div class="tile">
      <div class="tile-value">${escapeHtml(String(value))}</div>
      <div class="tile-label">${escapeHtml(label)}</div>
    </div>`;
}

export function buildVisitPdfHtml(data: VisitPdfData): string {
  const statsSection = data.stats
    ? `
    <div class="section">
      <div class="grid-2">
        ${statTile(data.stats.feeds24h, "Feeds / 24h")}
        ${statTile(data.stats.diapers24h, "Diapers / 24h")}
      </div>
    </div>`
    : "";

  const averagesSection = data.averages
    ? `
    <div class="section">
      <div class="section-title">Daily averages · ${escapeHtml(data.averages.rangeLabel)}</div>
      <div class="grid-2">
        ${statTile(data.averages.diapersPerDay, "Diapers / day")}
        ${statTile(data.averages.bottlePerDay, "Bottle / day")}
        ${statTile(data.averages.breastLPerDay, "Breast (L) / day")}
        ${statTile(data.averages.breastRPerDay, "Breast (R) / day")}
      </div>
      <div class="grid-1">
        ${statTile(data.averages.breastTotalPerDay, "Breast total (L+R) / day")}
      </div>
    </div>`
    : "";

  const appointmentsSection = `
    <div class="section">
      <div class="section-title">Appointments</div>
      ${
        data.appointments.length === 0
          ? `<p class="muted">No appointments scheduled.</p>`
          : data.appointments
              .map(
                (a) => `
        <div class="card">
          <div class="card-title">${escapeHtml(a.dateLabel)}</div>
          ${a.notes ? `<div class="card-notes">${escapeHtml(a.notes)}</div>` : ""}
        </div>`
              )
              .join("")
      }
    </div>`;

  const questionsSection = `
    <div class="section">
      <div class="section-title">Questions for the doctor</div>
      ${
        data.questions.length === 0
          ? `<p class="muted">No questions recorded.</p>`
          : `<ul class="question-list">
              ${data.questions
                .map(
                  (q) =>
                    `<li class="${q.answered ? "answered" : ""}">${q.answered ? "&#9745;" : "&#9744;"} ${escapeHtml(q.question)}</li>`
                )
                .join("")}
            </ul>`
      }
    </div>`;

  const photosSection = `
    <div class="section">
      <div class="section-title">Flagged photos</div>
      ${
        data.flaggedPhotos.length === 0
          ? `<p class="muted">No photos flagged.</p>`
          : `<div class="photo-grid">
              ${data.flaggedPhotos
                .filter((p) => p.dataUri)
                .map((p) => `<img class="photo" src="${p.dataUri}" alt="${escapeHtml(p.filename)}" />`)
                .join("")}
            </div>`
      }
    </div>`;

  const diapersSection = `
    <div class="section">
      <div class="section-title">Flagged diaper notes</div>
      ${
        data.flaggedDiapers.length === 0
          ? `<p class="muted">No flagged diaper notes.</p>`
          : data.flaggedDiapers
              .map(
                (d) => `
        <div class="card row">
          <div class="card-title">${escapeHtml(d.label)}</div>
          <div class="card-notes">${escapeHtml(d.notes ?? "No note")}</div>
          <div class="muted small">${escapeHtml(d.dateLabel)}</div>
        </div>`
              )
              .join("")
      }
    </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1C1C1A; padding: 32px; }
  h1 { font-family: Georgia, serif; font-size: 24px; margin: 0 0 4px; }
  .subtitle { color: #1C1C1A99; font-size: 12px; margin: 0 0 24px; }
  .section { margin-bottom: 24px; }
  .section-title { font-family: Georgia, serif; font-weight: 700; font-size: 15px; margin-bottom: 10px; }
  .grid-2 { display: flex; gap: 12px; }
  .grid-1 { display: flex; gap: 12px; margin-top: 12px; }
  .tile { flex: 1; background: #F2F5F0; border: 1px solid #DDE4DA; border-radius: 12px; padding: 14px; text-align: center; }
  .tile-value { font-size: 18px; font-weight: 700; }
  .tile-label { font-size: 10px; color: #1C1C1A99; margin-top: 4px; }
  .card { background: #fff; border: 1px solid #DDE4DA; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; }
  .card-title { font-size: 13px; font-weight: 600; }
  .card-notes { font-size: 12px; color: #1C1C1A99; margin-top: 3px; }
  .muted { font-size: 13px; color: #1C1C1A66; }
  .small { font-size: 11px; }
  .question-list { list-style: none; padding: 0; margin: 0; }
  .question-list li { font-size: 13px; padding: 6px 0; border-bottom: 1px solid #F2F5F0; }
  .question-list li.answered { color: #1C1C1A66; text-decoration: line-through; }
  .photo-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .photo { width: 110px; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid #DDE4DA; }
</style>
</head>
<body>
  <h1>${escapeHtml(data.babyName)} — Doctor Visit</h1>
  <p class="subtitle">Generated ${escapeHtml(data.generatedDate)}</p>
  ${statsSection}
  ${averagesSection}
  ${appointmentsSection}
  ${questionsSection}
  ${photosSection}
  ${diapersSection}
</body>
</html>`;
}
