import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSWRConfig } from "swr";
import { BabyForm, BabyFormValues } from "@/components/baby/BabyForm";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useBaby } from "@/hooks/useBaby";
import { apiFetch } from "@/lib/apiClient";
import { cancelBabyReminders, rescheduleBabyReminders, requestNotificationPermissions } from "@/lib/notifications";
import { useTheme } from "@/theme/ThemeContext";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export default function EditBabyScreen() {
  const { babyId } = useLocalSearchParams<{ babyId: string }>();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: baby, isLoading } = useBaby(babyId);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(values: BabyFormValues) {
    setLoading(true);
    const res = await apiFetch(`/babies/${babyId}`, {
      method: "PATCH",
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        nickname: values.nickname || null,
        birthDate: values.birthDate,
        weight: values.weight ? parseFloat(values.weight) : null,
        height: values.height ? parseFloat(values.height) : null,
        diaperReminderMinutes: values.diaperReminderMinutes ? parseInt(values.diaperReminderMinutes, 10) : null,
        feedingReminderMinutes: values.feedingReminderMinutes ? parseInt(values.feedingReminderMinutes, 10) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast("Failed to update baby", "error");
      return;
    }
    const updatedBaby = await res.json();
    await mutate(`/babies/${babyId}`);
    await mutate("/babies");
    if (updatedBaby.diaperReminderMinutes || updatedBaby.feedingReminderMinutes) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        toast("Reminders need notification permission to work", "error");
      } else {
        await rescheduleBabyReminders(updatedBaby);
      }
    }
    toast("Baby updated!", "success");
    router.replace(`/(app)/babies/${babyId}` as never);
  }

  function handleDelete() {
    Alert.alert(
      `Delete ${baby?.name ?? "this baby"}?`,
      "This permanently removes all their logs, photos, and appointments.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const res = await apiFetch(`/babies/${babyId}`, { method: "DELETE" });
            setDeleting(false);
            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              toast(d.error ?? "Failed to delete baby", "error");
              return;
            }
            await cancelBabyReminders(babyId);
            await mutate("/babies");
            toast("Baby deleted", "success");
            router.replace("/(app)/dashboard");
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Spinner />
      </View>
    );
  }
  if (!baby) return null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <PageHeader title="Edit baby" onBack={() => router.replace(`/(app)/babies/${babyId}` as never)} />
      <View style={styles.form}>
        <BabyForm
          initialValues={{
            firstName: baby.firstName ?? "",
            lastName: baby.lastName ?? "",
            nickname: baby.nickname ?? "",
            birthDate: toDateInputValue(baby.birthDate),
            weight: baby.weight != null ? String(baby.weight) : "",
            height: baby.height != null ? String(baby.height) : "",
            diaperReminderMinutes: baby.diaperReminderMinutes != null ? String(baby.diaperReminderMinutes) : "",
            feedingReminderMinutes: baby.feedingReminderMinutes != null ? String(baby.feedingReminderMinutes) : "",
          }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          loading={loading}
        />

        <View style={[styles.dangerCard, { borderColor: colors.pink[100] + "99" }]}>
          <Button variant="danger" loading={deleting} onPress={handleDelete} style={styles.deleteButton}>
            Delete baby
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 32 },
  form: { paddingHorizontal: 16, gap: 16 },
  dangerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  deleteButton: { width: "100%" },
});
