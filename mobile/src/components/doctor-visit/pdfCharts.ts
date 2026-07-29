// Renders GrowthLineChart / WeeklyStackedBarChart as static SVG markup
// strings for embedding directly in the PDF's HTML — expo-print's renderer
// supports real <svg> natively, so this reuses the exact same D3 math as the
// on-screen chart components (src/components/charts/*) rather than
// screenshotting them, giving crisp vector output instead of a raster image.
import { max as d3max, min as d3min } from "d3-array";
import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
import { line as d3line } from "d3-shape";
import { timeFormat } from "d3-time-format";
import { ChartDay, ChartSeries, GrowthPoint } from "@/components/charts/chartHelpers";

const WIDTH = 328;
const HEIGHT = 160;

const dateFmtFull = timeFormat("%b %d, %Y");
const dateFmt = timeFormat("%b %d");
const weekdayFmt = timeFormat("%a");

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function buildGrowthChartHtml(title: string, points: GrowthPoint[], unit: string, color: string, emptyLabel: string): string {
  const MARGIN = { top: 20, right: 12, bottom: 20, left: 32 };
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const latest = points.length > 0 ? `<span class="chart-latest">${points[points.length - 1].value} ${escapeHtml(unit)}</span>` : "";

  if (points.length === 0) {
    return `
      <div class="chart-block">
        <div class="chart-atomic">
          <div class="chart-header"><h3>${escapeHtml(title)}</h3></div>
          <p class="empty">${escapeHtml(emptyLabel)}</p>
        </div>
      </div>`;
  }

  const values = points.map((p) => p.value);
  const minValue = d3min(values) ?? 0;
  const maxValue = d3max(values) ?? 0;
  const pad = maxValue === minValue ? Math.max(maxValue * 0.1, 1) : (maxValue - minValue) * 0.15;
  const yDomain: [number, number] = [Math.max(minValue - pad, 0), maxValue + pad];

  const x = scaleTime()
    .domain([points[0].date, points[points.length - 1].date])
    .range([0, innerW]);
  const y = scaleLinear().domain(yDomain).range([innerH, 0]).nice();
  const yTicks = y.ticks(4);

  const gen = d3line<GrowthPoint>()
    .x((p) => x(p.date))
    .y((p) => y(p.value));
  const linePath = gen(points) ?? "";

  const cx = (i: number) => (points.length === 1 ? innerW / 2 : x(points[i].date));

  const gridlines = yTicks
    .map(
      (t) => `
      <line x1="${MARGIN.left}" x2="${MARGIN.left + innerW}" y1="${MARGIN.top + y(t)}" y2="${MARGIN.top + y(t)}" stroke="#e1e0d9" stroke-width="1" />
      <text x="${MARGIN.left - 6}" y="${MARGIN.top + y(t) + 3}" text-anchor="end" font-size="9" fill="#898781">${t}</text>`
    )
    .join("");

  const dots = points
    .map((p, i) => `<circle cx="${MARGIN.left + cx(i)}" cy="${MARGIN.top + y(p.value)}" r="3.5" fill="${color}" stroke="white" stroke-width="1.5" />`)
    .join("");

  const endLabels = `
    <text x="${MARGIN.left + cx(0)}" y="${MARGIN.top + innerH + 14}" text-anchor="start" font-size="9" fill="#898781">${dateFmt(points[0].date)}</text>
    ${
      points.length > 1
        ? `<text x="${MARGIN.left + cx(points.length - 1)}" y="${MARGIN.top + innerH + 14}" text-anchor="end" font-size="9" fill="#898781">${dateFmt(points[points.length - 1].date)}</text>`
        : ""
    }`;

  const rows = [...points]
    .reverse()
    .map((p) => `<tr><td>${dateFmtFull(p.date)}</td><td class="num">${p.value} ${escapeHtml(unit)}</td></tr>`)
    .join("");

  return `
    <div class="chart-block">
      <div class="chart-atomic">
        <div class="chart-header"><h3>${escapeHtml(title)}</h3>${latest}</div>
        <svg width="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}">
          ${gridlines}
          <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${MARGIN.left},${MARGIN.top})" />
          ${dots}
          ${endLabels}
          <line x1="${MARGIN.left}" x2="${MARGIN.left + innerW}" y1="${MARGIN.top + innerH}" y2="${MARGIN.top + innerH}" stroke="#c3c2b7" stroke-width="1" />
        </svg>
      </div>
      <table class="data-table">
        <thead><tr><th>Date</th><th class="num">Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function dayTick(d: Date, dense: boolean) {
  const today = new Date();
  const yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yest";
  return dense ? weekdayFmt(d) : dateFmt(d);
}

export function buildStackedBarChartHtml(
  title: string,
  series: ChartSeries[],
  data: ChartDay[],
  rangeLabel: string,
  emptyLabel: string,
  extraColumns?: { key: string; label: string; format: (day: ChartDay) => string }[]
): string {
  const MARGIN = { top: 20, right: 8, bottom: 20, left: 24 };
  const BAR_MAX = 24;
  const GAP = 2;
  const MIN_LABEL_BAND = 14;
  const DENSE_THRESHOLD = 7;
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const dense = data.length <= DENSE_THRESHOLD;

  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.counts[s.key] ?? 0), 0));
  const grandTotal = totals.reduce((a, b) => a + b, 0);

  const legend = series
    .map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${escapeHtml(s.label)}</span>`)
    .join("");

  if (grandTotal === 0) {
    return `
      <div class="chart-block">
        <div class="chart-atomic">
          <div class="chart-header"><h3>${escapeHtml(title)}</h3><span class="chart-latest">${escapeHtml(rangeLabel)}</span></div>
          <p class="empty">${escapeHtml(emptyLabel)}</p>
        </div>
      </div>`;
  }

  const maxTotal = d3max(totals) ?? 0;
  const yMax = Math.max(maxTotal, 4);
  const x = scaleBand<number>()
    .domain(data.map((_, i) => i))
    .range([0, innerW])
    .padding(0.35);
  const y = scaleLinear().domain([0, yMax]).range([innerH, 0]).nice();
  const yTicks = y.ticks(3);
  const barWidth = Math.min(BAR_MAX, x.bandwidth());
  const showTotals = x.bandwidth() >= MIN_LABEL_BAND;

  const gridlines = yTicks
    .map(
      (t) => `
      <line x1="${MARGIN.left}" x2="${MARGIN.left + innerW}" y1="${MARGIN.top + y(t)}" y2="${MARGIN.top + y(t)}" stroke="#e1e0d9" stroke-width="1" />
      <text x="${MARGIN.left - 6}" y="${MARGIN.top + y(t) + 3}" text-anchor="end" font-size="9" fill="#898781">${t}</text>`
    )
    .join("");

  const bars = data
    .map((d, i) => {
      const cxBar = (x(i) ?? 0) + x.bandwidth() / 2 - barWidth / 2;
      const total = totals[i];
      let cumulative = 0;
      const segments = series
        .map((s) => {
          const value = d.counts[s.key] ?? 0;
          const top = cumulative;
          cumulative += value;
          return { ...s, value, top };
        })
        .filter((s) => s.value > 0);
      const stackTopY = total > 0 ? y(total) : innerH;

      const rects = segments
        .map((s) => {
          const segTop = y(s.top + s.value);
          const segBottom = y(s.top);
          const h = Math.max(segBottom - segTop - GAP, 0);
          return `<rect x="${MARGIN.left + cxBar}" y="${MARGIN.top + segTop + GAP / 2}" width="${barWidth}" height="${h}" fill="${s.color}" />`;
        })
        .join("");

      const totalLabel =
        total > 0 && showTotals
          ? `<text x="${MARGIN.left + cxBar + barWidth / 2}" y="${MARGIN.top + stackTopY - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#52514e">${total}</text>`
          : "";
      const dayLabel = `<text x="${MARGIN.left + cxBar + barWidth / 2}" y="${MARGIN.top + innerH + 14}" text-anchor="middle" font-size="9" fill="#898781">${dayTick(d.date, dense)}</text>`;

      return rects + totalLabel + dayLabel;
    })
    .join("");

  const rows = data
    .map((d, i) => {
      const cells = series.map((s) => `<td class="num">${d.counts[s.key] ?? 0}</td>`).join("");
      const extraCells = extraColumns?.map((c) => `<td class="num">${escapeHtml(c.format(d))}</td>`).join("") ?? "";
      return `<tr><td>${dayTick(d.date, true)} · ${dateFmt(d.date)}</td>${cells}${extraCells}<td class="num total-cell">${totals[i]}</td></tr>`;
    })
    .join("");

  const headerCells = series.map((s) => `<th class="num">${escapeHtml(s.label)}</th>`).join("");
  const extraHeaderCells = extraColumns?.map((c) => `<th class="num">${escapeHtml(c.label)}</th>`).join("") ?? "";

  return `
    <div class="chart-block">
      <div class="chart-atomic">
        <div class="chart-header"><h3>${escapeHtml(title)}</h3><span class="chart-latest">${escapeHtml(rangeLabel)}</span></div>
        <svg width="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}">
          ${gridlines}
          ${bars}
          <line x1="${MARGIN.left}" x2="${MARGIN.left + innerW}" y1="${MARGIN.top + innerH}" y2="${MARGIN.top + innerH}" stroke="#c3c2b7" stroke-width="1" />
        </svg>
        <div class="legend">${legend}</div>
      </div>
      <table class="data-table">
        <thead><tr><th>Day</th>${headerCells}${extraHeaderCells}<th class="num">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
