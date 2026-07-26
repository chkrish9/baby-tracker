import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import useSWR, { useSWRConfig } from "swr";
import { BackChevronIcon, EditIcon, TrashIcon } from "@/components/icons";
import { AppointmentFormModal, Appointment } from "@/components/doctor-visit/AppointmentFormModal";
import { buildVisitPdfHtml } from "@/components/doctor-visit/pdfTemplate";
import { VisitPrep } from "@/components/doctor-visit/VisitPrep";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useBaby } from "@/hooks/useBaby";
import { apiFetch } from "@/lib/apiClient";
import { formatApptDate, relativeDayLabel } from "@/lib/dates";
import { generateAndSharePdf, imageToDataUri } from "@/lib/pdf";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

const fetcher = (url: string) =>
  apiFetch(url).then((r) => {
    if (!r.ok) throw new Error("Not found");
    return r.json();
  });

interface DiaperLog {
  type: string;
  notes?: string | null;
  loggedAt: string;
}

export default function AppointmentDetailScreen() {
  const { babyId, appointmentId } = useLocalSearchParams<{ babyId: string; appointmentId: string }>();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: baby } = useBaby(babyId);
  const { data: appt, error, isLoading } = useSWR<Appointment>(`/babies/${babyId}/appointments/${appointmentId}`, fetcher);

  const [showEditModal, setShowEditModal] = useState(false);
  const [apptSaving, setApptSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleSaveAppt(values: { date: string; notes: string }) {
    setApptSaving(true);
    const body = { date: new Date(`${values.date}T00:00:00`).toISOString(), notes: values.notes || null };
    const res = await apiFetch(`/babies/${babyId}/appointments/${appointmentId}`, { method: "PATCH", body: JSON.stringify(body) });
    setApptSaving(false);
    if (!res.ok) {
      toast("Failed to save appointment", "error");
      return;
    }
    await mutate(`/babies/${babyId}/appointments/${appointmentId}`);
    await mutate(`/babies/${babyId}/appointments`);
    toast("Appointment updated!", "success");
    setShowEditModal(false);
  }

  function handleDeleteAppt() {
    Alert.alert("Delete this appointment?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/babies/${babyId}/appointments/${appointmentId}`, { method: "DELETE" });
          if (!res.ok) {
            toast("Failed to delete", "error");
            return;
          }
          await mutate(`/babies/${babyId}/appointments`);
          toast("Appointment removed", "success");
          router.replace(`/(app)/babies/${babyId}/doctor-visit` as never);
        },
      },
    ]);
  }

  async function handleExportPdf() {
    if (!appt) return;
    setExporting(true);
    try {
      const notesRes = await apiFetch(`/babies/${babyId}/doctor-notes?appointmentId=${appointmentId}`);
      const questions = notesRes.ok ? await notesRes.json() : [];
      const photosRes = await apiFetch(`/babies/${babyId}/photos?flagged=true&appointmentId=${appointmentId}`);
      const photos = photosRes.ok ? await photosRes.json() : [];
      const diapersRes = await apiFetch(`/babies/${babyId}/diapers?flagged=true&appointmentId=${appointmentId}`);
      const flaggedDiapers = diapersRes.ok ? await diapersRes.json() : [];

      const photoRows = await Promise.all(
        photos.map(async (p: { path: string; filename: string }) => ({
          dataUri: await imageToDataUri(p.path),
          filename: p.filename,
        }))
      );

      const html = buildVisitPdfHtml({
        babyName: baby?.name ?? "Baby",
        generatedDate: new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
        appointments: [{ dateLabel: formatApptDate(appt.date, "long"), notes: appt.notes }],
        questions: questions.map((q: { question: string; answered: boolean }) => ({ question: q.question, answered: q.answered })),
        flaggedDiapers: flaggedDiapers.map((d: DiaperLog) => ({
          label: d.type,
          notes: d.notes,
          dateLabel: formatApptDate(d.loggedAt),
        })),
        flaggedPhotos: photoRows,
      });

      await generateAndSharePdf(html);
    } catch {
      toast("Failed to generate PDF", "error");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Spinner />
      </View>
    );
  }

  if (error || !appt) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground + "80" }]}>Appointment not found.</Text>
        <Pressable onPress={() => router.replace(`/(app)/babies/${babyId}/doctor-visit` as never)}>
          <Text style={[styles.notFoundLink, { color: colors.foreground }]}>Back to doctor visit</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace(`/(app)/babies/${babyId}/doctor-visit` as never)}
          style={[styles.backButton, { backgroundColor: "#fff", borderColor: colors.pink[100] + "99" }]}
        >
          <BackChevronIcon color={colors.foreground} />
        </Pressable>
        <Text style={[textStyles.pageTitle, { color: colors.foreground }]}>{relativeDayLabel(appt.date)}</Text>
      </View>

      <View style={[styles.apptCard, { borderColor: colors.pink[100] + "99" }]}>
        <View style={styles.flex1}>
          <Text style={[styles.apptDate, { color: colors.foreground }]}>{formatApptDate(appt.date, "long")}</Text>
          {appt.notes && <Text style={[styles.apptNotes, { color: colors.foreground + "80" }]}>{appt.notes}</Text>}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => setShowEditModal(true)} hitSlop={8}>
            <EditIcon color={colors.foreground + "4D"} />
          </Pressable>
          <Pressable onPress={handleDeleteAppt} hitSlop={8}>
            <TrashIcon color={colors.foreground + "4D"} />
          </Pressable>
        </View>
      </View>

      <Button variant="secondary" size="sm" loading={exporting} onPress={handleExportPdf} style={styles.pdfButton}>
        Download PDF
      </Button>

      <VisitPrep babyId={babyId} appointmentId={appointmentId} />

      <AppointmentFormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        editing={appt}
        onSubmit={handleSaveAppt}
        saving={apptSaving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 14 },
  notFoundLink: { fontSize: 14, fontWeight: "600" },
  scroll: { maxWidth: 512, width: "100%", alignSelf: "center", padding: 16, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1 },
  apptCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  apptDate: { fontSize: 14, fontWeight: "600" },
  apptNotes: { fontSize: 14, marginTop: 4 },
  actions: { flexDirection: "row", gap: 12 },
  pdfButton: { alignSelf: "flex-start" },
});
