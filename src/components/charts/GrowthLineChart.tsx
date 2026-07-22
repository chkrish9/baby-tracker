"use client";
import { useMemo, useState } from "react";
import { scaleTime, scaleLinear, max as d3max, min as d3min, line as d3line, timeFormat } from "d3";
import type { GrowthPoint } from "@/lib/charts";

interface Props {
  title: string;
  points: GrowthPoint[];
  unit: string;
  emptyLabel: string;
  color: string;
}

const WIDTH = 328;
const HEIGHT = 160;
const MARGIN = { top: 20, right: 12, bottom: 20, left: 32 };

const dateFmt = timeFormat("%b %d");
const dateFmtFull = timeFormat("%b %d, %Y");

export function GrowthLineChart({ title, points, unit, emptyLabel, color }: Props) {
  const [hover, setHover] = useState<{ x: number; y: number; index: number } | null>(null);
  const [showTable, setShowTable] = useState(false);

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const values = points.map((p) => p.value);
  const minValue = d3min(values) ?? 0;
  const maxValue = d3max(values) ?? 0;
  const pad = maxValue === minValue ? Math.max(maxValue * 0.1, 1) : (maxValue - minValue) * 0.15;
  const yDomain: [number, number] = [Math.max(minValue - pad, 0), maxValue + pad];

  const x = useMemo(
    () =>
      scaleTime()
        .domain(points.length ? [points[0].date, points[points.length - 1].date] : [new Date(), new Date()])
        .range([0, innerW]),
    [points, innerW]
  );

  const y = scaleLinear().domain(yDomain).range([innerH, 0]).nice();
  const yTicks = y.ticks(4);

  const linePath = useMemo(() => {
    const gen = d3line<GrowthPoint>()
      .x((p) => x(p.date))
      .y((p) => y(p.value));
    return gen(points) ?? "";
  }, [points, x, y]);

  const cx = (i: number) => (points.length === 1 ? innerW / 2 : x(points[i].date));

  return (
    <div className="bg-white rounded-2xl border border-pink-100/60 p-4 relative">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {points.length > 0 && (
          <span className="text-xs text-foreground/40">{points[points.length - 1].value} {unit}</span>
        )}
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-foreground/40 py-8 text-center">{emptyLabel}</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto"
            role="img"
            aria-label={`${title} over time, line chart`}
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {yTicks.map((t) => (
                <g key={t}>
                  <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke="#e1e0d9" strokeWidth={1} />
                  <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={9} fill="#898781">
                    {t}
                  </text>
                </g>
              ))}

              <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={cx(i)}
                    cy={y(p.value)}
                    r={hover?.index === i ? 5 : 3.5}
                    fill={color}
                    stroke="white"
                    strokeWidth={1.5}
                    className="transition-all cursor-pointer"
                    onPointerEnter={(e) => {
                      const rect = (e.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
                      setHover({
                        x: rect ? (rect.width / WIDTH) * (MARGIN.left + cx(i)) : 0,
                        y: rect ? (rect.height / HEIGHT) * (MARGIN.top + y(p.value)) : 0,
                        index: i,
                      });
                    }}
                    onPointerLeave={() => setHover(null)}
                  >
                    <title>{`${dateFmtFull(p.date)}: ${p.value} ${unit}`}</title>
                  </circle>
                  {(i === 0 || i === points.length - 1) && (
                    <text x={cx(i)} y={innerH + 14} textAnchor={i === 0 ? "start" : "end"} fontSize={9} fill="#898781">
                      {dateFmt(p.date)}
                    </text>
                  )}
                </g>
              ))}

              <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="#c3c2b7" strokeWidth={1} />
            </g>
          </svg>

          {hover && (
            <div
              className="absolute z-10 pointer-events-none bg-white rounded-xl shadow-lg border border-pink-100/60 px-2.5 py-1.5 text-xs"
              style={{ left: hover.x, top: hover.y, transform: "translate(-50%, -130%)" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-foreground/50">{dateFmtFull(points[hover.index].date)}</span>
              </div>
              <div className="font-semibold text-foreground mt-0.5">
                {points[hover.index].value} {unit}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors mt-2"
          >
            {showTable ? "Hide table" : "Show as table"}
          </button>

          {showTable && (
            <div className={`mt-2 overflow-x-auto ${points.length > 8 ? "max-h-60 overflow-y-auto" : ""}`}>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-foreground/40">
                    <th className="text-left font-medium py-1 pr-2 sticky top-0 bg-white">Date</th>
                    <th className="text-right font-medium py-1 pl-1.5 sticky top-0 bg-white">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((p, i) => (
                    <tr key={i} className="border-t border-pink-100/60">
                      <td className="py-1 pr-2 text-foreground/70 whitespace-nowrap">{dateFmtFull(p.date)}</td>
                      <td className="text-right py-1 pl-1.5 font-semibold text-foreground tabular-nums">{p.value} {unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
