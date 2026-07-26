import { max as d3max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import { timeFormat } from "d3-time-format";
import { useMemo, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { ClipPath, Defs, G, Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/theme/ThemeContext";
import { ChartDataTable } from "./ChartDataTable";
import { ChartDay, ChartSeries } from "./chartHelpers";

interface TooltipExtraLine {
  label: string;
  value: string;
  color?: string;
}

interface ExtraColumn {
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

interface HoverState {
  dayIndex: number;
  label: string;
  value: number;
  color: string;
}

export function WeeklyStackedBarChart({ title, series, data, emptyLabel, rangeLabel, tooltipExtraLines, extraColumns }: Props) {
  const { colors } = useTheme();
  const [hover, setHover] = useState<HoverState | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [containerWidth, setContainerWidth] = useState(WIDTH);

  const dense = data.length <= DENSE_THRESHOLD;
  const labeledIndices = useMemo(() => tickIndices(data.length), [data.length]);

  const totals = useMemo(() => data.map((d) => series.reduce((sum, s) => sum + (d.counts[s.key] ?? 0), 0)), [data, series]);
  const grandTotal = totals.reduce((a, b) => a + b, 0);
  const maxTotal = d3max(totals) ?? 0;
  const yMax = Math.max(maxTotal, 4);

  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = useMemo(
    () =>
      scaleBand<number>()
        .domain(data.map((_, i) => i))
        .range([0, innerW])
        .padding(0.35),
    [data, innerW]
  );
  const y = useMemo(() => scaleLinear().domain([0, yMax]).range([innerH, 0]).nice(), [yMax, innerH]);

  const yTicks = y.ticks(3);
  const barWidth = Math.min(BAR_MAX, x.bandwidth());
  const showTotals = x.bandwidth() >= MIN_LABEL_BAND;

  const daySegments = useMemo(
    () =>
      data.map((d, i) => {
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
        return { segments, total };
      }),
    [data, series, totals]
  );

  function handleTouch(e: GestureResponderEvent) {
    if (grandTotal === 0) return;
    const scale = containerWidth / WIDTH;
    const localX = e.nativeEvent.locationX / scale - MARGIN.left;
    const localY = e.nativeEvent.locationY / scale - MARGIN.top;

    let dayIndex = 0;
    let nearestDist = Infinity;
    data.forEach((_, i) => {
      const bandCenter = (x(i) ?? 0) + x.bandwidth() / 2;
      const dist = Math.abs(bandCenter - localX);
      if (dist < nearestDist) {
        nearestDist = dist;
        dayIndex = i;
      }
    });

    const { segments } = daySegments[dayIndex];
    if (segments.length === 0) {
      setHover(null);
      return;
    }
    const value = y.invert(localY);
    const match = segments.find((s) => value >= s.top && value <= s.top + s.value) ?? segments[segments.length - 1];
    setHover({ dayIndex, label: match.label, value: match.value, color: match.color });
  }

  const extraLines = hover && tooltipExtraLines ? tooltipExtraLines(data[hover.dayIndex]) : [];
  const tooltipDay = hover ? data[hover.dayIndex] : null;

  return (
    <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.foreground + "66" }]}>{rangeLabel}</Text>
      </View>

      {grandTotal === 0 ? (
        <Text style={[styles.empty, { color: colors.foreground + "66" }]}>{emptyLabel}</Text>
      ) : (
        <>
          <View
            style={styles.chartTouchArea}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouch}
            onResponderMove={handleTouch}
            onResponderRelease={() => setTimeout(() => setHover(null), 1500)}
          >
            <Svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={(HEIGHT / WIDTH) * containerWidth}>
              <Defs>
                {data.map((d, i) => {
                  const cxBar = (x(i) ?? 0) + x.bandwidth() / 2 - barWidth / 2;
                  const total = totals[i];
                  const stackTopY = total > 0 ? y(total) : innerH;
                  return (
                    <ClipPath id={`bar-clip-${i}`} key={i}>
                      <Rect
                        x={MARGIN.left + cxBar}
                        y={MARGIN.top + stackTopY}
                        width={barWidth}
                        height={Math.max(innerH - stackTopY, 0)}
                        rx={4}
                      />
                    </ClipPath>
                  );
                })}
              </Defs>

              {yTicks.map((t) => (
                <Line
                  key={`gl-${t}`}
                  x1={MARGIN.left}
                  x2={MARGIN.left + innerW}
                  y1={MARGIN.top + y(t)}
                  y2={MARGIN.top + y(t)}
                  stroke="#e1e0d9"
                  strokeWidth={1}
                />
              ))}
              {yTicks.map((t) => (
                <SvgText key={`gt-${t}`} x={MARGIN.left - 6} y={MARGIN.top + y(t) + 3} textAnchor="end" fontSize={9} fill="#898781">
                  {t}
                </SvgText>
              ))}

              {data.map((d, i) => {
                const cxBar = (x(i) ?? 0) + x.bandwidth() / 2 - barWidth / 2;
                const { segments, total } = daySegments[i];
                const stackTopY = total > 0 ? y(total) : innerH;
                return (
                  <G key={i}>
                    <G clipPath={`url(#bar-clip-${i})`}>
                      {segments.map((s) => {
                        const segTop = y(s.top + s.value);
                        const segBottom = y(s.top);
                        const h = Math.max(segBottom - segTop - GAP, 0);
                        return (
                          <Rect
                            key={s.key}
                            x={MARGIN.left + cxBar}
                            y={MARGIN.top + segTop + GAP / 2}
                            width={barWidth}
                            height={h}
                            fill={s.color}
                            opacity={hover && hover.dayIndex === i && hover.label === s.label && hover.value === s.value ? 0.8 : 1}
                          />
                        );
                      })}
                    </G>
                    {total > 0 && showTotals && (
                      <SvgText
                        x={MARGIN.left + cxBar + barWidth / 2}
                        y={MARGIN.top + stackTopY - 5}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight="600"
                        fill="#52514e"
                      >
                        {total}
                      </SvgText>
                    )}
                    {labeledIndices.has(i) && (
                      <SvgText
                        x={MARGIN.left + cxBar + barWidth / 2}
                        y={MARGIN.top + innerH + 14}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#898781"
                      >
                        {dayTick(d.date, dense)}
                      </SvgText>
                    )}
                  </G>
                );
              })}

              <Line
                x1={MARGIN.left}
                x2={MARGIN.left + innerW}
                y1={MARGIN.top + innerH}
                y2={MARGIN.top + innerH}
                stroke="#c3c2b7"
                strokeWidth={1}
              />
            </Svg>
          </View>

          {hover && tooltipDay && (
            <View
              style={[
                styles.tooltip,
                {
                  borderColor: colors.pink[100] + "99",
                  left: Math.max(
                    8,
                    Math.min(containerWidth - 160, (((x(hover.dayIndex) ?? 0) + x.bandwidth() / 2) / innerW) * containerWidth - 70)
                  ),
                },
              ]}
            >
              <View style={styles.tooltipRow}>
                <View style={[styles.dot, { backgroundColor: hover.color }]} />
                <Text style={[styles.tooltipLabel, { color: colors.foreground + "80" }]}>{hover.label}</Text>
                <Text style={[styles.tooltipValue, { color: colors.foreground }]}>{hover.value}</Text>
              </View>
              {extraLines.length > 0 && (
                <View style={[styles.extraLines, { borderColor: colors.pink[100] + "66" }]}>
                  {extraLines.map((line, idx) => (
                    <View key={idx} style={styles.tooltipRow}>
                      {line.color && <View style={[styles.dot, { backgroundColor: line.color }]} />}
                      <Text style={[styles.tooltipLabel, { color: colors.foreground + "80" }]}>{line.label}</Text>
                      <Text style={[styles.tooltipValue, { color: colors.foreground }]}>{line.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={[styles.legend, { borderColor: colors.pink[100] + "99" }]}>
            {series.map((s) => (
              <View key={s.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={[styles.legendLabel, { color: colors.foreground + "99" }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={() => setShowTable((v) => !v)}>
            <Text style={[styles.toggle, { color: colors.foreground + "66" }]}>
              {showTable ? "Hide table" : "Show as table"}
            </Text>
          </Pressable>

          {showTable && (
            <View style={styles.tableWrap}>
              <ChartDataTable series={series} data={data} extraColumns={extraColumns} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 14, fontWeight: "600" },
  subtitle: { fontSize: 12 },
  empty: { fontSize: 14, textAlign: "center", paddingVertical: 32 },
  chartTouchArea: { position: "relative" },
  tooltip: {
    position: "absolute",
    top: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    width: 160,
    gap: 2,
  },
  tooltipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tooltipLabel: { fontSize: 11, flex: 1 },
  tooltipValue: { fontSize: 11, fontWeight: "600" },
  extraLines: { marginTop: 4, paddingTop: 4, borderTopWidth: 1, gap: 2 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12 },
  toggle: { fontSize: 12, marginTop: 8 },
  tableWrap: { marginTop: 8 },
});
