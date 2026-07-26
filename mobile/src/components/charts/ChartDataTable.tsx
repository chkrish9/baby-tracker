import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { ChartDay, ChartSeries } from "./chartHelpers";

const DENSE_THRESHOLD = 7;

function dayTick(d: Date) {
  const today = new Date();
  const yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yest";
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function dateFmt(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ExtraColumn {
  key: string;
  label: string;
  format: (day: ChartDay) => string;
}

export function ChartDataTable({
  series,
  data,
  extraColumns,
}: {
  series: ChartSeries[];
  data: ChartDay[];
  extraColumns?: ExtraColumn[];
}) {
  const { colors } = useTheme();
  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.counts[s.key] ?? 0), 0));
  const scrollable = data.length > DENSE_THRESHOLD;

  const table = (
    <View>
      <View style={[styles.headerRow, { borderColor: colors.pink[100] + "99" }]}>
        <Text style={[styles.headerCell, styles.dayCol, { color: colors.foreground }]}>Day</Text>
        {series.map((s) => (
          <Text key={s.key} style={[styles.headerCell, styles.numCol, { color: colors.foreground }]}>
            {s.label}
          </Text>
        ))}
        {extraColumns?.map((c) => (
          <Text key={c.key} style={[styles.headerCell, styles.numCol, { color: colors.foreground }]}>
            {c.label}
          </Text>
        ))}
        <Text style={[styles.headerCell, styles.numCol, { color: colors.foreground }]}>Total</Text>
      </View>
      {data.map((d, i) => (
        <View key={i} style={[styles.row, { borderColor: colors.pink[100] + "99" }]}>
          <Text style={[styles.cell, styles.dayCol, { color: colors.foreground + "B3" }]}>
            {dayTick(d.date)} · {dateFmt(d.date)}
          </Text>
          {series.map((s) => (
            <Text key={s.key} style={[styles.cell, styles.numCol, { color: colors.foreground }]}>
              {d.counts[s.key] ?? 0}
            </Text>
          ))}
          {extraColumns?.map((c) => (
            <Text key={c.key} style={[styles.cell, styles.numCol, { color: colors.foreground }]}>
              {c.format(d)}
            </Text>
          ))}
          <Text style={[styles.cell, styles.numCol, styles.totalCell, { color: colors.foreground }]}>{totals[i]}</Text>
        </View>
      ))}
    </View>
  );

  return scrollable ? <ScrollView style={styles.scrollable}>{table}</ScrollView> : table;
}

const styles = StyleSheet.create({
  scrollable: { maxHeight: 240 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 4 },
  headerCell: { fontSize: 11, fontWeight: "700" },
  row: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 4 },
  cell: { fontSize: 11 },
  dayCol: { flex: 1.4 },
  numCol: { flex: 1, textAlign: "right" },
  totalCell: { fontWeight: "600" },
});
