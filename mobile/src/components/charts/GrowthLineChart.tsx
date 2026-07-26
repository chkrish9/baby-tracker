import { max as d3max, min as d3min } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import { line as d3line } from "d3-shape";
import { timeFormat } from "d3-time-format";
import { useMemo, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/theme/ThemeContext";
import { GrowthPoint } from "./chartHelpers";

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
  const { colors } = useTheme();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [containerWidth, setContainerWidth] = useState(WIDTH);

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

  const y = useMemo(() => scaleLinear().domain(yDomain).range([innerH, 0]).nice(), [yDomain, innerH]);
  const yTicks = y.ticks(4);

  const linePath = useMemo(() => {
    const gen = d3line<GrowthPoint>()
      .x((p) => x(p.date))
      .y((p) => y(p.value));
    return gen(points) ?? "";
  }, [points, x, y]);

  const cx = (i: number) => (points.length === 1 ? innerW / 2 : x(points[i].date));

  function handleTouch(e: GestureResponderEvent) {
    if (points.length === 0) return;
    const scale = containerWidth / WIDTH;
    const localX = e.nativeEvent.locationX / scale - MARGIN.left;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((_, i) => {
      const dist = Math.abs(cx(i) - localX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {points.length > 0 && (
          <Text style={[styles.subtitle, { color: colors.foreground + "66" }]}>
            {points[points.length - 1].value} {unit}
          </Text>
        )}
      </View>

      {points.length === 0 ? (
        <Text style={[styles.empty, { color: colors.foreground + "66" }]}>{emptyLabel}</Text>
      ) : (
        <>
          <View
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouch}
            onResponderMove={handleTouch}
            onResponderRelease={() => setTimeout(() => setHoverIndex(null), 1500)}
          >
            <Svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={(HEIGHT / WIDTH) * containerWidth}>
              {yTicks.map((t) => (
                <Line
                  key={t}
                  x1={MARGIN.left}
                  x2={MARGIN.left + innerW}
                  y1={MARGIN.top + y(t)}
                  y2={MARGIN.top + y(t)}
                  stroke="#e1e0d9"
                  strokeWidth={1}
                />
              ))}
              {yTicks.map((t) => (
                <SvgText
                  key={`label-${t}`}
                  x={MARGIN.left - 6}
                  y={MARGIN.top + y(t) + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill="#898781"
                >
                  {t}
                </SvgText>
              ))}

              <Path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={`translate(${MARGIN.left},${MARGIN.top})`}
              />

              {points.map((p, i) => (
                <Circle
                  key={i}
                  cx={MARGIN.left + cx(i)}
                  cy={MARGIN.top + y(p.value)}
                  r={hoverIndex === i ? 5 : 3.5}
                  fill={color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              ))}

              {points.length > 0 && (
                <SvgText x={MARGIN.left + cx(0)} y={MARGIN.top + innerH + 14} textAnchor="start" fontSize={9} fill="#898781">
                  {dateFmt(points[0].date)}
                </SvgText>
              )}
              {points.length > 1 && (
                <SvgText
                  x={MARGIN.left + cx(points.length - 1)}
                  y={MARGIN.top + innerH + 14}
                  textAnchor="end"
                  fontSize={9}
                  fill="#898781"
                >
                  {dateFmt(points[points.length - 1].date)}
                </SvgText>
              )}

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

          {hoverIndex !== null && (
            <View
              style={[
                styles.tooltip,
                {
                  borderColor: colors.pink[100] + "99",
                  left: Math.max(8, Math.min(containerWidth - 140, (cx(hoverIndex) / innerW) * containerWidth - 60)),
                },
              ]}
            >
              <View style={styles.tooltipRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[styles.tooltipDate, { color: colors.foreground + "80" }]}>
                  {dateFmtFull(points[hoverIndex].date)}
                </Text>
              </View>
              <Text style={[styles.tooltipValue, { color: colors.foreground }]}>
                {points[hoverIndex].value} {unit}
              </Text>
            </View>
          )}

          <Pressable onPress={() => setShowTable((v) => !v)}>
            <Text style={[styles.toggle, { color: colors.foreground + "66" }]}>
              {showTable ? "Hide table" : "Show as table"}
            </Text>
          </Pressable>

          {showTable && (
            <View style={styles.tableWrap}>
              <View style={[styles.tableHeaderRow, { borderColor: colors.pink[100] + "99" }]}>
                <Text style={[styles.tableHeaderCell, { color: colors.foreground, flex: 2 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.foreground, flex: 1, textAlign: "right" }]}>Value</Text>
              </View>
              {[...points].reverse().map((p, i) => (
                <View key={i} style={[styles.tableRow, { borderColor: colors.pink[100] + "99" }]}>
                  <Text style={[styles.tableCell, { color: colors.foreground + "B3", flex: 2 }]}>{dateFmtFull(p.date)}</Text>
                  <Text style={[styles.tableCell, styles.tableValueCell, { color: colors.foreground, flex: 1 }]}>
                    {p.value} {unit}
                  </Text>
                </View>
              ))}
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
    width: 140,
  },
  tooltipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tooltipDate: { fontSize: 11 },
  tooltipValue: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  toggle: { fontSize: 12, marginTop: 8 },
  tableWrap: { marginTop: 8 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 4 },
  tableHeaderCell: { fontSize: 11, fontWeight: "700" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 4 },
  tableCell: { fontSize: 11 },
  tableValueCell: { fontWeight: "600", textAlign: "right" },
});
