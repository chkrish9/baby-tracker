"use client";
import { useMemo, useState, useId } from "react";
import { scaleBand, scaleLinear, max as d3max, timeFormat } from "d3";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface ChartDay {
  date: Date;
  counts: Record<string, number>;
  extra?: Record<string, number>;
}

interface TooltipExtraLine {
  label: string;
  value: string;
  color?: string;
}

export interface ExtraColumn {
  key: string;
  label: string;
  format: (day: ChartDay) => string;
}

interface Props {
  title: string;
  series: ChartSeries[];
  data: ChartDay[];
  emptyLabel: string;
  rangeLabel: string;
  tooltipExtraLines?: (day: ChartDay) => TooltipExtraLine[];
  extraColumns?: ExtraColumn[];
}

const WIDTH = 328;
const HEIGHT = 160;
const MARGIN = { top: 20, right: 8, bottom: 20, left: 24 };
const BAR_MAX = 24;
const GAP = 2;
const MIN_LABEL_BAND = 14;
const DENSE_THRESHOLD = 7;

const weekdayFmt = timeFormat("%a");
const dateFmt = timeFormat("%b %d");

function dayTick(d: Date, dense: boolean) {
  const today = new Date();
  const yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yest";
  return dense ? weekdayFmt(d) : dateFmt(d);
}

function tickIndices(n: number): Set<number> {
  if (n <= DENSE_THRESHOLD) return new Set(Array.from({ length: n }, (_, i) => i));
  const targetCount = 6;
  const step = Math.ceil(n / targetCount);
  const idxs = new Set<number>();
  for (let i = 0; i < n; i += step) idxs.add(i);
  idxs.add(n - 1);
  return idxs;
}

export function ChartDataTable({
  series,
  data,
  extraColumns,
  scrollable = true,
}: {
  series: ChartSeries[];
  data: ChartDay[];
  extraColumns?: ExtraColumn[];
  scrollable?: boolean;
}) {
  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.counts[s.key] ?? 0), 0));

  return (
    <div className={`overflow-x-auto ${scrollable && data.length > DENSE_THRESHOLD ? "max-h-60 overflow-y-auto" : ""}`}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left font-bold py-1 pr-2 sticky top-0 bg-white">Day</th>
            {series.map((s) => (
              <th key={s.key} className="text-right font-bold py-1 px-1.5 sticky top-0 bg-white">{s.label}</th>
            ))}
            {extraColumns?.map((c) => (
              <th key={c.key} className="text-right font-bold py-1 px-1.5 sticky top-0 bg-white">{c.label}</th>
            ))}
            <th className="text-right font-bold py-1 pl-1.5 sticky top-0 bg-white">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td className="py-1 pr-2 text-foreground/70 whitespace-nowrap">{dayTick(d.date, true)} · {dateFmt(d.date)}</td>
              {series.map((s) => (
                <td key={s.key} className="text-right py-1 px-1.5 text-foreground tabular-nums">
                  {d.counts[s.key] ?? 0}
                </td>
              ))}
              {extraColumns?.map((c) => (
                <td key={c.key} className="text-right py-1 px-1.5 text-foreground tabular-nums">
                  {c.format(d)}
                </td>
              ))}
              <td className="text-right py-1 pl-1.5 font-semibold text-foreground tabular-nums">{totals[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WeeklyStackedBarChart({ title, series, data, emptyLabel, rangeLabel, tooltipExtraLines, extraColumns }: Props) {
  const gradientId = useId();
  const [hover, setHover] = useState<{ x: number; y: number; label: string; value: number; color: string; dayIndex: number } | null>(null);
  const [showTable, setShowTable] = useState(false);

  const dense = data.length <= DENSE_THRESHOLD;
  const labeledIndices = useMemo(() => tickIndices(data.length), [data.length]);

  const totals = useMemo(() => data.map((d) => series.reduce((sum, s) => sum + (d.counts[s.key] ?? 0), 0)), [data, series]);
  const grandTotal = totals.reduce((a, b) => a + b, 0);
  const maxTotal = d3max(totals) ?? 0;
  const yMax = Math.max(maxTotal, 4);

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = scaleBand<number>()
    .domain(data.map((_, i) => i))
    .range([0, innerW])
    .padding(0.35);

  const y = scaleLinear().domain([0, yMax]).range([innerH, 0]).nice();

  const yTicks = y.ticks(3);
  const barWidth = Math.min(BAR_MAX, x.bandwidth());
  const showTotals = x.bandwidth() >= MIN_LABEL_BAND;

  const extraLines = hover && tooltipExtraLines ? tooltipExtraLines(data[hover.dayIndex]) : [];

  return (
    <div className="bg-white rounded-2xl border border-pink-100/60 p-4 relative">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-foreground/40">{rangeLabel}</span>
      </div>

      {grandTotal === 0 ? (
        <p className="text-sm text-foreground/40 py-8 text-center">{emptyLabel}</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto"
            role="img"
            aria-label={`${title}, bar chart, ${rangeLabel.toLowerCase()}`}
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Gridlines */}
              {yTicks.map((t) => (
                <g key={t}>
                  <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke="#e1e0d9" strokeWidth={1} />
                  <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={9} fill="#898781">
                    {t}
                  </text>
                </g>
              ))}

              {/* Bars */}
              {data.map((d, i) => {
                const cx = (x(i) ?? 0) + x.bandwidth() / 2 - barWidth / 2;
                let cumulative = 0;
                const total = totals[i];
                const segments = series
                  .map((s) => {
                    const value = d.counts[s.key] ?? 0;
                    const top = cumulative;
                    cumulative += value;
                    return { ...s, value, top };
                  })
                  .filter((s) => s.value > 0);

                const stackTopY = total > 0 ? y(total) : innerH;

                return (
                  <g key={i}>
                    <clipPath id={`${gradientId}-clip-${i}`}>
                      <rect x={cx} y={stackTopY} width={barWidth} height={Math.max(innerH - stackTopY, 0)} rx={4} />
                    </clipPath>
                    <g clipPath={`url(#${gradientId}-clip-${i})`}>
                      {segments.map((s) => {
                        const segTop = y(s.top + s.value);
                        const segBottom = y(s.top);
                        const h = Math.max(segBottom - segTop - GAP, 0);
                        return (
                          <rect
                            key={s.key}
                            x={cx}
                            y={segTop + GAP / 2}
                            width={barWidth}
                            height={h}
                            fill={s.color}
                            className="transition-opacity"
                            opacity={hover && hover.dayIndex === i && hover.label === s.label && hover.value === s.value ? 0.8 : 1}
                            onPointerEnter={(e) => {
                              const rect = (e.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
                              setHover({
                                x: rect ? (rect.width / WIDTH) * (cx + barWidth / 2) : 0,
                                y: rect ? (rect.height / HEIGHT) * (MARGIN.top + segTop) : 0,
                                label: s.label,
                                value: s.value,
                                color: s.color,
                                dayIndex: i,
                              });
                            }}
                            onPointerLeave={() => setHover(null)}
                          >
                            <title>{`${s.label}: ${s.value}`}</title>
                          </rect>
                        );
                      })}
                    </g>
                    {total > 0 && showTotals && (
                      <text x={cx + barWidth / 2} y={stackTopY - 5} textAnchor="middle" fontSize={10} fontWeight={600} fill="#52514e">
                        {total}
                      </text>
                    )}
                    {labeledIndices.has(i) && (
                      <text x={cx + barWidth / 2} y={innerH + 14} textAnchor="middle" fontSize={9} fill="#898781">
                        {dayTick(d.date, dense)}
                      </text>
                    )}
                  </g>
                );
              })}

              <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="#c3c2b7" strokeWidth={1} />
            </g>
          </svg>

          {hover && (
            <div
              className="absolute z-10 pointer-events-none bg-white rounded-xl shadow-lg border border-pink-100/60 px-2.5 py-1.5 text-xs"
              style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -110%)" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: hover.color }} />
                <span className="text-foreground/50">{hover.label}</span>
                <span className="font-semibold text-foreground">{hover.value}</span>
              </div>
              {extraLines.length > 0 && (
                <div className="mt-1 pt-1 border-t border-pink-100/40 space-y-0.5">
                  {extraLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      {line.color && <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: line.color }} />}
                      <span className="text-foreground/50">{line.label}</span>
                      <span className="font-semibold text-foreground">{line.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-pink-100/60">
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-foreground/60">{s.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors mt-2"
          >
            {showTable ? "Hide table" : "Show as table"}
          </button>

          {showTable && (
            <div className="mt-2">
              <ChartDataTable series={series} data={data} extraColumns={extraColumns} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
