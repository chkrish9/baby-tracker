import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSWRConfig } from "swr";
import { DiaperIcon, EditIcon, FlagIcon, TrashIcon, BottleIcon } from "@/components/icons";
import { DiaperFormModal, DiaperLog } from "@/components/baby/DiaperFormModal";
import { FeedingFormModal, FeedingLog } from "@/components/baby/FeedingFormModal";
import { FlagAppointmentsModal } from "@/components/doctor-visit/FlagAppointmentsModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useDiapers } from "@/hooks/useDiapers";
import { useFeedings } from "@/hooks/useFeeding";
import { apiFetch } from "@/lib/apiClient";
import { useBabyContext } from "@/lib/BabyContext";
import { dayLabel, formatTime, timeAgo } from "@/lib/dates";
import { rescheduleReminder } from "@/lib/notifications";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

const FEED_LABELS: Record<string, string> = {
  BREAST_LEFT: "Breast (L)",
  BREAST_RIGHT: "Breast (R)",
  BOTTLE: "Bottle",
  SOLID: "Solid",
};

const DIAPER_LABELS: Record<string, string> = { WET: "Wet", DIRTY: "Dirty", BOTH: "Mixed", DRY: "Dry" };

type Tab = "feeding" | "diaper";

function groupByDay<T extends { loggedAt: string }>(logs: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  const seen = new Map<string, number>();
  for (const item of logs) {
    const key = new Date(item.loggedAt).toDateString();
    const label = dayLabel(item.loggedAt);
    if (!seen.has(key)) {
      seen.set(key, groups.length);
      groups.push({ label, items: [item] });
    } else {
      groups[seen.get(key)!].items.push(item);
    }
  }
  return groups;
}

export default function FeedingLogsScreen() {
  const { babyId, tab: tabParam } = useLocalSearchParams<{ babyId: string; tab?: string }>();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { baby } = useBabyContext();

  const [tab, setTab] = useState<Tab>("feeding");
  useEffect(() => {
    if (tabParam === "diaper") setTab("diaper");
  }, [tabParam]);

  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showDiaperModal, setShowDiaperModal] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedingLog | null>(null);
  const [editingDiaper, setEditingDiaper] = useState<DiaperLog | null>(null);
  const [flaggingDiaper, setFlaggingDiaper] = useState<(DiaperLog & { appointmentIds: string[] }) | null>(null);

  const { data: feedings, isLoading: feedLoading } = useFeedings(babyId);
  const { data: diapers, isLoading: diaperLoading } = useDiapers(babyId);

  async function refreshFeedings() {
    const fresh = await mutate(`/babies/${babyId}/feeding`);
    await mutate(`/babies/${babyId}`);
    await rescheduleReminder({
      babyId,
      babyName: baby?.name,
      type: "feeding",
      intervalMinutes: baby?.feedingReminderMinutes,
      lastLoggedAt: fresh?.[0]?.loggedAt ?? null,
    });
  }
  async function refreshDiapers() {
    const fresh = await mutate(`/babies/${babyId}/diapers`);
    await mutate(`/babies/${babyId}`);
    await rescheduleReminder({
      babyId,
      babyName: baby?.name,
      type: "diaper",
      intervalMinutes: baby?.diaperReminderMinutes,
      lastLoggedAt: fresh?.[0]?.loggedAt ?? null,
    });
  }

  async function handleDeleteFeed(logId: string) {
    const res = await apiFetch(`/babies/${babyId}/feeding/${logId}`, { method: "DELETE" });
    if (res.ok) {
      await refreshFeedings();
      toast("Entry deleted", "success");
    } else {
      toast("Failed to delete", "error");
    }
  }

  async function handleDeleteDiaper(logId: string) {
    const res = await apiFetch(`/babies/${babyId}/diapers/${logId}`, { method: "DELETE" });
    if (res.ok) {
      await refreshDiapers();
      toast("Entry deleted", "success");
    } else {
      toast("Failed to delete", "error");
    }
  }

  async function handleSaveDiaperFlags(logId: string, appointmentIds: string[]) {
    const res = await apiFetch(`/babies/${babyId}/diapers/${logId}/appointments`, {
      method: "PUT",
      body: JSON.stringify({ appointmentIds }),
    });
    if (res.ok) {
      await refreshDiapers();
      toast(appointmentIds.length === 0 ? "Unflagged" : "Flagged for the doctor", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  const feedGroups = useMemo(() => groupByDay<FeedingLog>(feedings ?? []), [feedings]);
  const diaperGroups = useMemo(
    () => groupByDay<DiaperLog & { appointmentIds: string[] }>(diapers ?? []),
    [diapers]
  );
  const isLoading = tab === "feeding" ? feedLoading : diaperLoading;
  const isEmpty = tab === "feeding" ? !feedings?.length : !diapers?.length;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <View style={[styles.tabTrack, { backgroundColor: colors.pink[50] }]}>
        <Pressable
          onPress={() => setTab("feeding")}
          style={[styles.tabButton, tab === "feeding" && [styles.tabButtonActive, { backgroundColor: "#fff" }]]}
        >
          <Text style={[styles.tabLabel, { color: tab === "feeding" ? colors.foreground : colors.foreground + "66" }]}>
            Feeding
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("diaper")}
          style={[styles.tabButton, tab === "diaper" && [styles.tabButtonActive, { backgroundColor: "#fff" }]]}
        >
          <Text style={[styles.tabLabel, { color: tab === "diaper" ? colors.foreground : colors.foreground + "66" }]}>
            Diaper
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[textStyles.pageTitle, { color: colors.foreground }]}>{tab === "feeding" ? "Feedings" : "Diapers"}</Text>
        <Button
          size="sm"
          onPress={() => {
            if (tab === "feeding") {
              setEditingFeed(null);
              setShowFeedModal(true);
            } else {
              setEditingDiaper(null);
              setShowDiaperModal(true);
            }
          }}
        >
          + {tab === "feeding" ? "Log feed" : "Log diaper"}
        </Button>
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <Spinner />
        </View>
      )}

      {!isLoading && isEmpty && (
        <View style={styles.emptyState}>
          {tab === "feeding" ? (
            <BottleIcon size={28} color={colors.foreground + "4D"} />
          ) : (
            <DiaperIcon size={28} color={colors.foreground + "4D"} />
          )}
          <Text style={[styles.emptyText, { color: colors.foreground + "4D" }]}>
            No {tab === "feeding" ? "feedings" : "diaper changes"} yet
          </Text>
        </View>
      )}

      <View style={styles.groups}>
        {tab === "feeding" &&
          feedGroups.map((group) => (
            <View key={group.label}>
              <Text style={[styles.groupLabel, { color: colors.foreground + "66" }]}>{group.label}</Text>
              <View style={styles.rowList}>
                {group.items.map((log) => (
                  <View key={log.id} style={[styles.row, { borderColor: colors.pink[100] + "99" }]}>
                    <View style={[styles.iconChip, { backgroundColor: colors.pink[50] }]}>
                      <BottleIcon color={colors.pink[400]} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{FEED_LABELS[log.type] ?? log.type}</Text>
                      <Text style={[styles.rowSubtitle, { color: colors.foreground + "80" }]} numberOfLines={1}>
                        {[
                          log.amount != null ? `${log.amount} ${log.unit ?? "ml"}` : null,
                          log.duration != null ? `${log.duration} ${log.unit ?? "min"}` : null,
                          log.notes,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                    <View style={styles.timeCol}>
                      <Text style={[styles.timeText, { color: colors.foreground }]}>{formatTime(log.loggedAt)}</Text>
                      <Text style={[styles.timeAgoText, { color: colors.foreground + "66" }]}>{timeAgo(log.loggedAt)}</Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setEditingFeed(log);
                        setShowFeedModal(true);
                      }}
                      hitSlop={8}
                    >
                      <EditIcon color={colors.foreground + "33"} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteFeed(log.id)} hitSlop={8}>
                      <TrashIcon color={colors.foreground + "33"} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))}

        {tab === "diaper" &&
          diaperGroups.map((group) => (
            <View key={group.label}>
              <Text style={[styles.groupLabel, { color: colors.foreground + "66" }]}>{group.label}</Text>
              <View style={styles.rowList}>
                {group.items.map((log) => {
                  const chipBg = log.type === "WET" ? "#e6f3ff" : log.type === "DIRTY" ? "#fffbeb" : colors.pink[50];
                  const chipColor = log.type === "WET" ? "#0ea5e9" : log.type === "DIRTY" ? "#f59e0b" : colors.pink[400];
                  const flagged = (log.appointmentIds ?? []).length > 0;
                  return (
                    <View key={log.id} style={[styles.row, { borderColor: colors.pink[100] + "99" }]}>
                      <View style={[styles.iconChip, { backgroundColor: chipBg }]}>
                        <DiaperIcon color={chipColor} />
                      </View>
                      <View style={styles.flex1}>
                        <View style={styles.diaperLabelRow}>
                          <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                            {DIAPER_LABELS[log.type] ?? log.type}
                          </Text>
                          {flagged && <FlagIcon size={13} filled color={colors.pink[500]} />}
                        </View>
                        <Text style={[styles.rowSubtitle, { color: colors.foreground + "80" }]} numberOfLines={1}>
                          {log.notes ?? "No note"}
                        </Text>
                      </View>
                      <View style={styles.timeCol}>
                        <Text style={[styles.timeText, { color: colors.foreground }]}>{formatTime(log.loggedAt)}</Text>
                        <Text style={[styles.timeAgoText, { color: colors.foreground + "66" }]}>{timeAgo(log.loggedAt)}</Text>
                      </View>
                      <Pressable onPress={() => setFlaggingDiaper(log)} hitSlop={8}>
                        <FlagIcon size={16} filled={flagged} color={flagged ? colors.pink[500] : colors.foreground + "33"} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setEditingDiaper(log);
                          setShowDiaperModal(true);
                        }}
                        hitSlop={8}
                      >
                        <EditIcon color={colors.foreground + "33"} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteDiaper(log.id)} hitSlop={8}>
                        <TrashIcon color={colors.foreground + "33"} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
      </View>

      <FeedingFormModal
        open={showFeedModal}
        onClose={() => {
          setShowFeedModal(false);
          setEditingFeed(null);
        }}
        babyId={babyId}
        editingLog={editingFeed}
        onSaved={refreshFeedings}
        apiFetch={apiFetch}
      />
      <DiaperFormModal
        open={showDiaperModal}
        onClose={() => {
          setShowDiaperModal(false);
          setEditingDiaper(null);
        }}
        babyId={babyId}
        editingLog={editingDiaper}
        onSaved={refreshDiapers}
        apiFetch={apiFetch}
      />
      {flaggingDiaper && (
        <FlagAppointmentsModal
          open={!!flaggingDiaper}
          onClose={() => setFlaggingDiaper(null)}
          babyId={babyId}
          currentAppointmentIds={flaggingDiaper.appointmentIds}
          onSave={(ids) => handleSaveDiaperFlags(flaggingDiaper.id, ids)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxWidth: 512, width: "100%", alignSelf: "center", paddingBottom: 32 },
  tabTrack: { flexDirection: "row", borderRadius: 16, padding: 4, marginHorizontal: 16, marginTop: 16 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  tabButtonActive: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabLabel: { fontSize: 14, fontWeight: "500" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loading: { paddingVertical: 48, alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 64, gap: 12 },
  emptyText: { fontSize: 14 },
  groups: { paddingHorizontal: 16, gap: 16 },
  groupLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
  rowList: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  iconChip: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  diaperLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowSubtitle: { fontSize: 12, marginTop: 1 },
  timeCol: { alignItems: "flex-end", marginRight: 4 },
  timeText: { fontSize: 14, fontWeight: "500" },
  timeAgoText: { fontSize: 12 },
});
