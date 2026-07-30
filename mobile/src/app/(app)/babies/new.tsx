import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSWRConfig } from "swr";
import { BabyForm, BabyFormValues } from "@/components/baby/BabyForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiClient";
import { useTheme } from "@/theme/ThemeContext";

export default function NewBabyScreen() {
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: BabyFormValues) {
    setLoading(true);
    const res = await apiFetch("/babies", {
      method: "POST",
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        nickname: values.nickname || null,
        birthDate: values.birthDate,
        weight: values.weight ? parseFloat(values.weight) : null,
        height: values.height ? parseFloat(values.height) : null,
        diaperReminderHours: values.diaperReminderHours ? parseInt(values.diaperReminderHours, 10) : null,
        feedingReminderHours: values.feedingReminderHours ? parseInt(values.feedingReminderHours, 10) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast("Failed to create baby", "error");
      return;
    }
    const baby = await res.json();
    await mutate("/babies");
    toast(`${baby.name} added!`, "success");
    router.replace(`/(app)/babies/${baby.id}` as never);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <PageHeader title="Add a baby" onBack={() => router.back()} />
      <View style={styles.form}>
        <BabyForm onSubmit={handleSubmit} submitLabel="Add baby" loading={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  form: { paddingHorizontal: 16 },
});
