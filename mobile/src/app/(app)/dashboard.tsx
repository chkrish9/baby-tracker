import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSWRConfig } from "swr";
import { BackChevronIcon, EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useBabies } from "@/hooks/useBaby";
import { apiFetch } from "@/lib/apiClient";
import { useAuthHeaders, filesUrl } from "@/lib/files";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

interface Baby {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  birthDate: string;
  profilePhoto?: string | null;
}

function fullName(baby: Baby) {
  return [baby.firstName, baby.lastName].filter(Boolean).join(" ") || baby.name;
}

function ageLabel(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const weeks = Math.floor(days / 7);
  days = days % 7;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0 || parts.length === 0) parts.push(`${days}d`);

  return `${parts.join(" ")} old`;
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { data: babies, isLoading } = useBabies();
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const authHeaders = useAuthHeaders();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleBack() {
    const activeBabyId = await AsyncStorage.getItem("activeBabyId");
    if (activeBabyId) {
      router.push(`/(app)/babies/${activeBabyId}` as never);
    } else {
      router.back();
    }
  }

  function handleDelete(baby: Baby) {
    Alert.alert(
      `Delete ${fullName(baby)}?`,
      "This permanently removes all their logs, photos, and appointments.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(baby.id);
            const res = await apiFetch(`/babies/${baby.id}`, { method: "DELETE" });
            setDeletingId(null);
            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              toast(d.error ?? "Failed to delete baby", "error");
              return;
            }
            await mutate("/babies");
            toast("Baby deleted", "success");
          },
        },
      ]
    );
  }

  const hasBabies = !isLoading && (babies?.length ?? 0) > 0;

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          {hasBabies && (
            <Pressable
              onPress={handleBack}
              style={[styles.backButton, { backgroundColor: "#fff", borderColor: colors.pink[100] + "99" }]}
            >
              <BackChevronIcon color={colors.foreground} />
            </Pressable>
          )}
          <Text style={[textStyles.pageTitle, { color: colors.foreground }]}>Your babies</Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.foreground + "80" }]}>
          Each baby keeps their own feeding logs, diaper history, and photos. Tap a baby to switch.
        </Text>

        {isLoading && (
          <View style={styles.loading}>
            <Spinner />
          </View>
        )}

        <View style={styles.list}>
          {babies?.map((baby: Baby, i: number) => (
            <Pressable
              key={baby.id}
              onPress={() => router.push(`/(app)/babies/${baby.id}` as never)}
              style={[styles.babyRow, { borderColor: colors.pink[100] + "99" }]}
            >
              <Avatar
                src={baby.profilePhoto ? filesUrl(baby.profilePhoto) : undefined}
                headers={authHeaders}
                name={fullName(baby)}
                size={52}
                colorIndex={i}
              />
              <View style={styles.babyInfo}>
                <Text style={[styles.babyName, { color: colors.foreground }]} numberOfLines={1}>
                  {fullName(baby)}
                </Text>
                <Text style={[styles.babyAge, { color: colors.foreground + "80" }]}>{ageLabel(baby.birthDate)}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => router.push(`/(app)/babies/${baby.id}/edit` as never)}
                  style={styles.iconButton}
                  hitSlop={8}
                >
                  <EditIcon color={colors.foreground + "66"} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(baby)}
                  disabled={deletingId === baby.id}
                  style={styles.iconButton}
                  hitSlop={8}
                >
                  <TrashIcon color={colors.foreground + "66"} />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {!isLoading && (
        <Pressable
          onPress={() => router.push("/(app)/babies/new")}
          style={[styles.fab, { backgroundColor: colors.pink[500] }]}
        >
          <PlusIcon color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scroll: {
    maxWidth: 512,
    width: "100%",
    alignSelf: "center",
    padding: 16,
    paddingBottom: 96,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  loading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  list: {
    gap: 12,
  },
  babyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  babyInfo: {
    flex: 1,
    minWidth: 0,
  },
  babyName: {
    fontSize: 16,
    fontWeight: "600",
  },
  babyAge: {
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
