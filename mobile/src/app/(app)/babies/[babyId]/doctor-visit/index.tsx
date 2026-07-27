import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import useSWR, { useSWRConfig } from "swr";
import { BackChevronIcon, CalendarIcon, ChevronIcon, EditIcon, TrashIcon } from "@/components/icons";
import { WeeklyStackedBarChart } from "@/components/charts/WeeklyStackedBarChart";
import {
  ChartRange,
  DIAPER_SERIES,
  FEED_EXTRA_COLUMNS,
  FEED_SERIES,
  RANGE_OPTIONS,
  bucketByDay,
  daysForRange,
  feedTooltipExtraLines,
  feedingExtra,
} from "@/components/charts/chartHelpers";
import { AppointmentFormModal, Appointment } from "@/components/doctor-visit/AppointmentFormModal";
import { buildDoctorVisitPdfHtml } from "@/components/doctor-visit/pdfTemplate";
import { VisitPrep } from "@/components/doctor-visit/VisitPrep";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useBaby } from "@/hooks/useBaby";
import { useGrowthRecords, useHealthRecords, useVaccinations } from "@/hooks/useHealth";
import { toGrowthPoints } from "@/components/charts/chartHelpers";
import { apiFetch } from "@/lib/apiClient";
import { formatApptDate, formatMinutes, formatMl, formatOz, relativeDayLabel, startOfToday } from "@/lib/dates";
import { generateAndSharePdf, imageToDataUri } from "@/lib/pdf";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

const DIAPER_LABELS: Record<string, string> = {
  WET: "Wet diaper",
  DIRTY: "Dirty diaper",
  BOTH: "Mixed diaper",
  DRY: "Dry diaper",
};

interface FeedingLog {
  id: string;
  type: string;
  amount?: number | null;
  duration?: number | null;
  unit?: string | null;
  loggedAt: string;
}
interface DiaperLog {
  id: string;
  type: string;
  notes?: string | null;
  loggedAt: string;
}

export default function DoctorVisitScreen() {
  const { babyId } = useLocalSearchParams<{ babyId: string }>();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: baby } = useBaby(babyId);
  const { data: feedings } = useSWR(`/babies/${babyId}/feeding`, fetcher);
  const { data: diapers } = useSWR(`/babies/${babyId}/diapers`, fetcher);
  const { data: appointments } = useSWR<Appointment[]>(`/babies/${babyId}/appointments`, fetcher);
  const { data: vaccinations } = useVaccinations(babyId);
  const { data: weightRecords } = useGrowthRecords(babyId, "WEIGHT");
  const { data: heightRecords } = useGrowthRecords(babyId, "HEIGHT");
  const { data: healthRecords } = useHealthRecords(babyId);

  const [showApptModal, setShowApptModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [apptSaving, setApptSaving] = useState(false);
  const [showApptHistory, setShowApptHistory] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [exporting, setExporting] = useState(false);

  const chartDays = useMemo(() => daysForRange(chartRange), [chartRange]);
  const feedChartData = useMemo(() => bucketByDay(feedings ?? [], chartDays, feedingExtra), [feedings, chartDays]);
  const diaperChartData = useMemo(() => bucketByDay(diapers ?? [], chartDays), [diapers, chartDays]);
  const chartRangeOption = RANGE_OPTIONS.find((o) => o.value === chartRange) ?? RANGE_OPTIONS[2];

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const feeds24h = feedings?.filter((f: FeedingLog) => new Date(f.loggedAt).getTime() > cutoff).length ?? 0;
  const diapers24h = diapers?.filter((d: DiaperLog) => new Date(d.loggedAt).getTime() > cutoff).length ?? 0;

  const numDays = chartDays.length;
  const totalDiapersInRange = diaperChartData.reduce((sum, d) => sum + Object.values(d.counts).reduce((a, b) => a + b, 0), 0);
  const totalBottleMl = feedChartData.reduce((sum, d) => sum + (d.extra?.bottleMl ?? 0), 0);
  const totalBreastLeftMin = feedChartData.reduce((sum, d) => sum + (d.extra?.breastLeftMin ?? 0), 0);
  const totalBreastRightMin = feedChartData.reduce((sum, d) => sum + (d.extra?.breastRightMin ?? 0), 0);
  const avgDiapersPerDay = totalDiapersInRange / numDays;
  const avgBottleMlPerDay = totalBottleMl / numDays;
  const avgBreastLeftMinPerDay = totalBreastLeftMin / numDays;
  const avgBreastRightMinPerDay = totalBreastRightMin / numDays;

  const today = startOfToday();
  const upcoming = (appointments ?? []).filter((a) => new Date(a.date) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = (appointments ?? []).filter((a) => new Date(a.date) < today).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const nextAppt = upcoming[0];
  const previousAppt = past[0];
  const allAppointments = [...(appointments ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  async function handleSaveAppt(values: { date: string; notes: string }) {
    setApptSaving(true);
    const body = { date: new Date(`${values.date}T00:00:00`).toISOString(), notes: values.notes || null };
    const url = editingAppt ? `/babies/${babyId}/appointments/${editingAppt.id}` : `/babies/${babyId}/appointments`;
    const res = await apiFetch(url, { method: editingAppt ? "PATCH" : "POST", body: JSON.stringify(body) });
    setApptSaving(false);
    if (!res.ok) {
      toast("Failed to save appointment", "error");
      return;
    }
    await mutate(`/babies/${babyId}/appointments`);
    toast(editingAppt ? "Appointment updated!" : "Appointment added!", "success");
    setShowApptModal(false);
  }

  function handleDeleteAppt(id: string) {
    Alert.alert("Delete this appointment?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/babies/${babyId}/appointments/${id}`, { method: "DELETE" });
          if (res.ok) {
            await mutate(`/babies/${babyId}/appointments`);
            toast("Appointment removed", "success");
          } else {
            toast("Failed to delete", "error");
          }
        },
      },
    ]);
  }

  async function handleExportPdf() {
    if (!baby) return;
    setExporting(true);
    try {
      const scope = nextAppt?.id ?? "unassigned";
      const notesRes = await apiFetch(`/babies/${babyId}/doctor-notes?appointmentId=${scope}`);
      const questions = notesRes.ok ? await notesRes.json() : [];
      const photosRes = await apiFetch(`/babies/${babyId}/photos?flagged=true&appointmentId=${scope}`);
      const photos = photosRes.ok ? await photosRes.json() : [];
      const diapersRes = await apiFetch(`/babies/${babyId}/diapers?flagged=true&appointmentId=${scope}`);
      const flaggedDiapers = diapersRes.ok ? await diapersRes.json() : [];

      const photoRows = await Promise.all(
        photos.map(async (p: { path: string; filename: string }) => ({
          dataUri: await imageToDataUri(p.path),
          filename: p.filename,
        }))
      );

      const weightPoints = toGrowthPoints(weightRecords ?? []);
      const heightPoints = toGrowthPoints(heightRecords ?? []);

      const html = buildDoctorVisitPdfHtml({
        babyName: baby.name,
        birthDate: baby.birthDate,
        appointmentDate: nextAppt?.date ?? null,
        feeds24h,
        diapers24h,
        chartRangeLabel: chartRangeOption.label,
        chartRangePhrase: chartRangeOption.phrase,
        averages: {
          diapersPerDay: avgDiapersPerDay > 0 ? avgDiapersPerDay.toFixed(1) : "–",
          bottlePerDay: avgBottleMlPerDay > 0 ? `${formatOz(avgBottleMlPerDay)} (${formatMl(avgBottleMlPerDay)})` : "–",
          breastLPerDay: avgBreastLeftMinPerDay > 0 ? formatMinutes(avgBreastLeftMinPerDay) : "–",
          breastRPerDay: avgBreastRightMinPerDay > 0 ? formatMinutes(avgBreastRightMinPerDay) : "–",
          breastTotalPerDay:
            avgBreastLeftMinPerDay + avgBreastRightMinPerDay > 0
              ? formatMinutes(avgBreastLeftMinPerDay + avgBreastRightMinPerDay)
              : "–",
        },
        feedSeries: FEED_SERIES,
        diaperSeries: DIAPER_SERIES,
        feedChartData,
        diaperChartData,
        feedExtraColumns: FEED_EXTRA_COLUMNS,
        questions: questions.map((q: { question: string; answered: boolean }) => ({ question: q.question, answered: q.answered })),
        flaggedDiapers: flaggedDiapers.map((d: DiaperLog) => ({
          label: DIAPER_LABELS[d.type] ?? d.type,
          notes: d.notes,
          dateLabel: formatApptDate(d.loggedAt),
        })),
        flaggedPhotos: photoRows,
        vaccinations: (vaccinations ?? []).map((v: { date: string; name: string; notes?: string | null }) => ({
          date: v.date,
          name: v.name,
          notes: v.notes,
        })),
        weightPoints,
        heightPoints,
        weightUnit: weightRecords?.[0]?.unit ?? "kg",
        heightUnit: heightRecords?.[0]?.unit ?? "cm",
        weightRecords: (weightRecords ?? []).map((r: { recordedAt: string; value: number; unit: string }) => r),
        heightRecords: (heightRecords ?? []).map((r: { recordedAt: string; value: number; unit: string }) => r),
        healthRecords: (healthRecords ?? []).map((r: { date: string; title: string; notes?: string | null }) => r),
      });

      await generateAndSharePdf(html);
    } catch {
      toast("Failed to generate PDF", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push(`/(app)/babies/${babyId}` as never)}
          style={[styles.backButton, { backgroundColor: "#fff", borderColor: colors.pink[100] + "99" }]}
        >
          <BackChevronIcon color={colors.foreground} />
        </Pressable>
        <Text style={[textStyles.pageTitle, styles.flex1, { color: colors.foreground }]}>Doctor visit</Text>
        <Button variant="secondary" size="sm" loading={exporting} onPress={handleExportPdf}>
          Download PDF
        </Button>
      </View>

      <Text style={[styles.subtitle, { color: colors.foreground + "80" }]}>
        Everything you flagged for {baby?.name ?? "your baby"}&apos;s next appointment, gathered in one place.
      </Text>

      <View style={styles.statGrid}>
        <StatTile value={feeds24h} label="Feeds / 24h" />
        <StatTile value={diapers24h} label="Diapers / 24h" />
      </View>

      <View style={styles.averagesHeader}>
        <Text style={[styles.upperLabel, { color: colors.foreground + "66" }]}>
          Daily averages · {chartRangeOption.label}
        </Text>
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => setChartRange(o.value)}
              style={[
                styles.rangeChip,
                { borderColor: colors.pink[100], backgroundColor: chartRange === o.value ? colors.pink[500] : "#fff" },
              ]}
            >
              <Text style={[styles.rangeChipLabel, { color: chartRange === o.value ? "#fff" : colors.foreground }]}>
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.statGrid}>
        <StatTile value={avgDiapersPerDay > 0 ? avgDiapersPerDay.toFixed(1) : "–"} label="Diapers / day" small />
        <StatTile value={avgBottleMlPerDay > 0 ? formatOz(avgBottleMlPerDay) : "–"} label="Bottle / day" small />
      </View>
      <View style={styles.statGrid}>
        <StatTile value={avgBreastLeftMinPerDay > 0 ? formatMinutes(avgBreastLeftMinPerDay) : "–"} label="Breast (L) / day" small />
        <StatTile value={avgBreastRightMinPerDay > 0 ? formatMinutes(avgBreastRightMinPerDay) : "–"} label="Breast (R) / day" small />
      </View>
      <StatTile
        value={
          avgBreastLeftMinPerDay + avgBreastRightMinPerDay > 0
            ? formatMinutes(avgBreastLeftMinPerDay + avgBreastRightMinPerDay)
            : "–"
        }
        label="Breast total (L+R) / day"
        small
      />

      <View style={styles.trendsSection}>
        <Text style={[textStyles.sectionTitle, { color: colors.foreground }]}>Trends</Text>
        <WeeklyStackedBarChart
          title="Feedings"
          series={FEED_SERIES}
          data={feedChartData}
          rangeLabel={chartRangeOption.label}
          emptyLabel={`No feedings logged ${chartRangeOption.phrase}`}
          tooltipExtraLines={feedTooltipExtraLines}
          extraColumns={FEED_EXTRA_COLUMNS}
        />
        <WeeklyStackedBarChart
          title="Diapers"
          series={DIAPER_SERIES}
          data={diaperChartData}
          rangeLabel={chartRangeOption.label}
          emptyLabel={`No diaper changes logged ${chartRangeOption.phrase}`}
        />
      </View>

      <View style={styles.apptHeaderRow}>
        <Text style={[styles.upperLabel, { color: colors.foreground + "66" }]}>Appointments</Text>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            setEditingAppt(null);
            setShowApptModal(true);
          }}
        >
          + Add appointment
        </Button>
      </View>

      <View style={styles.statGrid}>
        <ApptTile
          appt={nextAppt}
          label="Next visit"
          emptyText="None scheduled"
          onPress={() => nextAppt && router.push(`/(app)/babies/${babyId}/doctor-visit/${nextAppt.id}` as never)}
        />
        <ApptTile
          appt={previousAppt}
          label="Previous visit"
          emptyText="No past visits"
          onPress={() => previousAppt && router.push(`/(app)/babies/${babyId}/doctor-visit/${previousAppt.id}` as never)}
        />
      </View>

      {allAppointments.length > 0 && (
        <View style={styles.historySection}>
          <Pressable onPress={() => setShowApptHistory((v) => !v)}>
            <Text style={[styles.linkText, { color: colors.foreground + "66" }]}>
              {showApptHistory ? "Hide all appointments" : `View all appointments (${allAppointments.length})`}
            </Text>
          </Pressable>
          {showApptHistory && (
            <View style={styles.historyList}>
              {allAppointments.map((appt) => (
                <Pressable
                  key={appt.id}
                  onPress={() => router.push(`/(app)/babies/${babyId}/doctor-visit/${appt.id}` as never)}
                  style={[styles.row, { borderColor: colors.pink[100] + "99" }]}
                >
                  <View style={styles.flex1}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]}>{formatApptDate(appt.date)}</Text>
                    {appt.notes && (
                      <Text style={[styles.rowNotes, { color: colors.foreground + "80" }]} numberOfLines={1}>
                        {appt.notes}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.rowRelative, { color: colors.foreground + "66" }]}>{relativeDayLabel(appt.date)}</Text>
                  <Pressable
                    onPress={() => {
                      setEditingAppt(appt);
                      setShowApptModal(true);
                    }}
                    hitSlop={8}
                  >
                    <EditIcon color={colors.foreground + "33"} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteAppt(appt.id)} hitSlop={8}>
                    <TrashIcon color={colors.foreground + "33"} />
                  </Pressable>
                  <ChevronIcon color={colors.foreground + "4D"} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      <VisitPrep babyId={babyId} appointmentId={nextAppt?.id ?? null} />

      <AppointmentFormModal
        open={showApptModal}
        onClose={() => setShowApptModal(false)}
        editing={editingAppt}
        onSubmit={handleSaveAppt}
        saving={apptSaving}
      />
    </ScrollView>
  );
}

function StatTile({ value, label, small }: { value: string | number; label: string; small?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statTile, { borderColor: colors.pink[100] + "99" }]}>
      <Text style={[small ? styles.statValueSmall : styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.foreground + "66" }]}>{label}</Text>
    </View>
  );
}

function ApptTile({
  appt,
  label,
  emptyText,
  onPress,
}: {
  appt?: Appointment;
  label: string;
  emptyText: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={styles.apptTileLabelRow}>
        <CalendarIcon size={16} color={colors.foreground + "66"} />
        <Text style={[styles.upperLabel, { color: colors.foreground + "66" }]}>{label}</Text>
      </View>
      {appt ? (
        <>
          <Text style={[styles.statValueSmall, { color: colors.foreground }]}>{relativeDayLabel(appt.date)}</Text>
          <Text style={[styles.rowNotes, { color: colors.foreground + "80" }]}>{formatApptDate(appt.date)}</Text>
        </>
      ) : (
        <Text style={[styles.emptyTileText, { color: colors.foreground + "66" }]}>{emptyText}</Text>
      )}
    </>
  );
  return appt ? (
    <Pressable onPress={onPress} style={[styles.statTile, { borderColor: colors.pink[100] + "99" }]}>
      {content}
    </Pressable>
  ) : (
    <View style={[styles.statTile, { borderColor: colors.pink[100] + "99" }]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxWidth: 512, width: "100%", alignSelf: "center", padding: 16, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1 },
  subtitle: { fontSize: 14, marginTop: -8 },
  statGrid: { flexDirection: "row", gap: 12 },
  statTile: { flex: 1, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700" },
  statValueSmall: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: "center" },
  emptyTileText: { fontSize: 13 },
  averagesHeader: { gap: 8 },
  upperLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  rangeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  rangeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  rangeChipLabel: { fontSize: 12, fontWeight: "500" },
  trendsSection: { gap: 12 },
  apptHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  apptTileLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  historySection: { gap: 8 },
  linkText: { fontSize: 12 },
  historyList: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 14 },
  rowTitle: { fontSize: 14, fontWeight: "500" },
  rowNotes: { fontSize: 12, marginTop: 1 },
  rowRelative: { fontSize: 12 },
});
