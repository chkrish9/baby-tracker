import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSWRConfig } from "swr";
import { EditIcon, NoteIcon, RulerIcon, ScaleIcon, TrashIcon, VaccineIcon } from "@/components/icons";
import { GrowthLineChart } from "@/components/charts/GrowthLineChart";
import { toGrowthPoints } from "@/components/charts/chartHelpers";
import { GrowthFormModal, GrowthRecord, GrowthType } from "@/components/health/GrowthFormModal";
import { HealthRecordFormModal, HealthRecordItem } from "@/components/health/HealthRecordFormModal";
import { VaccinationFormModal, Vaccination } from "@/components/health/VaccinationFormModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useBaby } from "@/hooks/useBaby";
import { useGrowthRecords, useHealthRecords, useVaccinations } from "@/hooks/useHealth";
import { apiFetch } from "@/lib/apiClient";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

type Tab = "vaccinations" | "weight" | "height" | "other";

const TABS: { value: Tab; label: string }[] = [
  { value: "vaccinations", label: "Vaccines" },
  { value: "weight", label: "Weight" },
  { value: "height", label: "Height" },
  { value: "other", label: "Other" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function HealthScreen() {
  const { babyId } = useLocalSearchParams<{ babyId: string }>();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: baby } = useBaby(babyId);

  const [tab, setTab] = useState<Tab>("vaccinations");

  const { data: vaccinations, isLoading: vaccLoading } = useVaccinations(babyId);
  const { data: weightRecords, isLoading: weightLoading } = useGrowthRecords(babyId, "WEIGHT");
  const { data: heightRecords, isLoading: heightLoading } = useGrowthRecords(babyId, "HEIGHT");
  const { data: healthRecords, isLoading: otherLoading } = useHealthRecords(babyId);

  const [showVaccModal, setShowVaccModal] = useState(false);
  const [editingVacc, setEditingVacc] = useState<Vaccination | null>(null);
  const [vaccSaving, setVaccSaving] = useState(false);

  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [editingGrowth, setEditingGrowth] = useState<GrowthRecord | null>(null);
  const [growthSaving, setGrowthSaving] = useState(false);

  const [showOtherModal, setShowOtherModal] = useState(false);
  const [editingOther, setEditingOther] = useState<HealthRecordItem | null>(null);
  const [otherSaving, setOtherSaving] = useState(false);

  const weightPoints = useMemo(() => toGrowthPoints(weightRecords ?? []), [weightRecords]);
  const heightPoints = useMemo(() => toGrowthPoints(heightRecords ?? []), [heightRecords]);
  const latestWeightUnit = weightRecords?.[0]?.unit ?? "kg";
  const latestHeightUnit = heightRecords?.[0]?.unit ?? "cm";

  async function handleSaveVacc(values: { name: string; date: string; notes: string }) {
    setVaccSaving(true);
    const body = {
      name: values.name,
      date: new Date(`${values.date}T00:00:00`).toISOString(),
      notes: values.notes || null,
    };
    const url = editingVacc ? `/babies/${babyId}/vaccinations/${editingVacc.id}` : `/babies/${babyId}/vaccinations`;
    const res = await apiFetch(url, { method: editingVacc ? "PATCH" : "POST", body: JSON.stringify(body) });
    setVaccSaving(false);
    if (!res.ok) {
      toast("Failed to save vaccination", "error");
      return;
    }
    await mutate(`/babies/${babyId}/vaccinations`);
    toast(editingVacc ? "Vaccination updated!" : "Vaccination added!", "success");
    setShowVaccModal(false);
  }

  async function handleDeleteVacc(id: string) {
    const res = await apiFetch(`/babies/${babyId}/vaccinations/${id}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(`/babies/${babyId}/vaccinations`);
      toast("Vaccination removed", "success");
    } else {
      toast("Failed to delete", "error");
    }
  }

  async function handleSaveGrowth(values: { value: string; unit: string; date: string; notes: string }) {
    setGrowthSaving(true);
    const growthType: GrowthType = tab === "height" ? "HEIGHT" : "WEIGHT";
    const body = {
      type: growthType,
      value: parseFloat(values.value),
      unit: values.unit,
      recordedAt: new Date(`${values.date}T00:00:00`).toISOString(),
      notes: values.notes || null,
    };
    const url = editingGrowth ? `/babies/${babyId}/growth/${editingGrowth.id}` : `/babies/${babyId}/growth`;
    const res = await apiFetch(url, { method: editingGrowth ? "PATCH" : "POST", body: JSON.stringify(body) });
    setGrowthSaving(false);
    if (!res.ok) {
      toast(`Failed to save ${tab}`, "error");
      return;
    }
    await mutate(`/babies/${babyId}/growth?type=${growthType}`);
    toast(editingGrowth ? "Record updated!" : "Record added!", "success");
    setShowGrowthModal(false);
  }

  async function handleDeleteGrowth(id: string, growthType: GrowthType) {
    const res = await apiFetch(`/babies/${babyId}/growth/${id}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(`/babies/${babyId}/growth?type=${growthType}`);
      toast("Record removed", "success");
    } else {
      toast("Failed to delete", "error");
    }
  }

  async function handleSaveOther(values: { title: string; date: string; notes: string }) {
    setOtherSaving(true);
    const body = {
      title: values.title,
      date: new Date(`${values.date}T00:00:00`).toISOString(),
      notes: values.notes || null,
    };
    const url = editingOther ? `/babies/${babyId}/health-records/${editingOther.id}` : `/babies/${babyId}/health-records`;
    const res = await apiFetch(url, { method: editingOther ? "PATCH" : "POST", body: JSON.stringify(body) });
    setOtherSaving(false);
    if (!res.ok) {
      toast("Failed to save record", "error");
      return;
    }
    await mutate(`/babies/${babyId}/health-records`);
    toast(editingOther ? "Record updated!" : "Record added!", "success");
    setShowOtherModal(false);
  }

  async function handleDeleteOther(id: string) {
    const res = await apiFetch(`/babies/${babyId}/health-records/${id}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(`/babies/${babyId}/health-records`);
      toast("Record removed", "success");
    } else {
      toast("Failed to delete", "error");
    }
  }

  const isLoading =
    (tab === "vaccinations" && vaccLoading) ||
    (tab === "weight" && weightLoading) ||
    (tab === "height" && heightLoading) ||
    (tab === "other" && otherLoading);

  const growthRecordsForTab = tab === "height" ? heightRecords : weightRecords;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[textStyles.pageTitle, { color: colors.foreground }]}>Health</Text>
      <Text style={[styles.subtitle, { color: colors.foreground + "80" }]}>
        {baby?.name ?? "Your baby"}&apos;s vaccinations, growth, and other health details.
      </Text>

      <View style={[styles.tabTrack, { backgroundColor: colors.pink[50] }]}>
        {TABS.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setTab(t.value)}
            style={[styles.tabButton, tab === t.value && [styles.tabButtonActive, { backgroundColor: "#fff" }]]}
          >
            <Text style={[styles.tabLabel, { color: tab === t.value ? colors.foreground : colors.foreground + "66" }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <Spinner />
        </View>
      )}

      {!isLoading && tab === "vaccinations" && (
        <View style={styles.section}>
          <View style={styles.addRow}>
            <Button size="sm" onPress={() => { setEditingVacc(null); setShowVaccModal(true); }}>
              + Add vaccination
            </Button>
          </View>
          {!vaccinations?.length ? (
            <Text style={[styles.emptyText, { color: colors.foreground + "66" }]}>No vaccinations logged yet</Text>
          ) : (
            <View style={styles.list}>
              {vaccinations.map((v: Vaccination) => (
                <View key={v.id} style={[styles.row, { borderColor: colors.pink[100] + "99" }]}>
                  <View style={[styles.iconChip, { backgroundColor: colors.pink[50] }]}>
                    <VaccineIcon color={colors.pink[400]} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]}>{v.name}</Text>
                    <Text style={[styles.rowDate, { color: colors.foreground + "80" }]}>{formatDate(v.date)}</Text>
                    {v.notes && <Text style={[styles.rowNotes, { color: colors.foreground + "80" }]}>{v.notes}</Text>}
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => { setEditingVacc(v); setShowVaccModal(true); }} hitSlop={8}>
                      <EditIcon color={colors.foreground + "66"} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteVacc(v.id)} hitSlop={8}>
                      <TrashIcon color={colors.foreground + "66"} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {!isLoading && (tab === "weight" || tab === "height") && (
        <View style={styles.section}>
          <GrowthLineChart
            title={tab === "weight" ? "Weight" : "Height"}
            points={tab === "weight" ? weightPoints : heightPoints}
            unit={tab === "weight" ? latestWeightUnit : latestHeightUnit}
            emptyLabel={`No ${tab} logged yet`}
            color={tab === "weight" ? "#2a78d6" : "#1baf7a"}
          />
          <View style={styles.addRow}>
            <Button size="sm" onPress={() => { setEditingGrowth(null); setShowGrowthModal(true); }}>
              + Log {tab}
            </Button>
          </View>
          {!growthRecordsForTab?.length ? (
            <Text style={[styles.emptyText, { color: colors.foreground + "66" }]}>No {tab} entries yet</Text>
          ) : (
            <View style={styles.list}>
              {growthRecordsForTab.map((r: GrowthRecord) => (
                <View key={r.id} style={[styles.row, { borderColor: colors.pink[100] + "99" }]}>
                  <View style={styles.iconChip}>
                    {tab === "weight" ? <ScaleIcon color="#0ea5e9" /> : <RulerIcon color="#0ea5e9" />}
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                      {r.value} {r.unit}
                    </Text>
                    <Text style={[styles.rowDate, { color: colors.foreground + "80" }]}>{formatDate(r.recordedAt)}</Text>
                    {r.notes && <Text style={[styles.rowNotes, { color: colors.foreground + "80" }]}>{r.notes}</Text>}
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => { setEditingGrowth(r); setShowGrowthModal(true); }} hitSlop={8}>
                      <EditIcon color={colors.foreground + "66"} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteGrowth(r.id, r.type)} hitSlop={8}>
                      <TrashIcon color={colors.foreground + "66"} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {!isLoading && tab === "other" && (
        <View style={styles.section}>
          <View style={styles.addRow}>
            <Button size="sm" onPress={() => { setEditingOther(null); setShowOtherModal(true); }}>
              + Add record
            </Button>
          </View>
          {!healthRecords?.length ? (
            <Text style={[styles.emptyText, { color: colors.foreground + "66" }]}>No other health records yet</Text>
          ) : (
            <View style={styles.list}>
              {healthRecords.map((r: HealthRecordItem) => (
                <View key={r.id} style={[styles.row, { borderColor: colors.pink[100] + "99" }]}>
                  <View style={[styles.iconChip, { backgroundColor: "#fffbeb" }]}>
                    <NoteIcon color="#f59e0b" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]}>{r.title}</Text>
                    <Text style={[styles.rowDate, { color: colors.foreground + "80" }]}>{formatDate(r.date)}</Text>
                    {r.notes && <Text style={[styles.rowNotes, { color: colors.foreground + "80" }]}>{r.notes}</Text>}
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => { setEditingOther(r); setShowOtherModal(true); }} hitSlop={8}>
                      <EditIcon color={colors.foreground + "66"} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteOther(r.id)} hitSlop={8}>
                      <TrashIcon color={colors.foreground + "66"} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <VaccinationFormModal
        open={showVaccModal}
        onClose={() => setShowVaccModal(false)}
        editing={editingVacc}
        onSubmit={handleSaveVacc}
        saving={vaccSaving}
      />
      <GrowthFormModal
        open={showGrowthModal}
        onClose={() => setShowGrowthModal(false)}
        growthType={tab === "height" ? "HEIGHT" : "WEIGHT"}
        editing={editingGrowth}
        onSubmit={handleSaveGrowth}
        saving={growthSaving}
      />
      <HealthRecordFormModal
        open={showOtherModal}
        onClose={() => setShowOtherModal(false)}
        editing={editingOther}
        onSubmit={handleSaveOther}
        saving={otherSaving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxWidth: 512, width: "100%", alignSelf: "center", padding: 16, gap: 16 },
  subtitle: { fontSize: 14, marginTop: -8 },
  tabTrack: { flexDirection: "row", borderRadius: 16, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  tabButtonActive: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabLabel: { fontSize: 12, fontWeight: "500" },
  loading: { paddingVertical: 48, alignItems: "center" },
  section: { gap: 12 },
  addRow: { alignItems: "flex-end" },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 32 },
  list: { gap: 8 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 14 },
  iconChip: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#e6f3ff", alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: "500" },
  rowDate: { fontSize: 12, marginTop: 1 },
  rowNotes: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
});
