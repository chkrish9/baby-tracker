import * as ImagePicker from "expo-image-picker";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import useSWR, { useSWRConfig } from "swr";
import {
  AvatarCameraDotIcon,
  BannerChevronIcon,
  BottleIcon,
  ChevronIcon,
  ClockIcon,
  DiaperIcon,
  PlusIcon,
  RulerIcon,
  ScaleIcon,
  StethoscopeIcon,
} from "@/components/icons";
import { DiaperFormModal, DiaperLog } from "@/components/baby/DiaperFormModal";
import { FeedingFormModal, FeedingLog } from "@/components/baby/FeedingFormModal";
import { QuickAddModal } from "@/components/baby/QuickAddModal";
import { GrowthLineChart } from "@/components/charts/GrowthLineChart";
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
  toGrowthPoints,
} from "@/components/charts/chartHelpers";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useBabies } from "@/hooks/useBaby";
import { useGrowthRecords } from "@/hooks/useHealth";
import { apiFetch } from "@/lib/apiClient";
import { useBabyContext } from "@/lib/BabyContext";
import { rescheduleReminder } from "@/lib/notifications";
import { formatMinutes, formatMl, formatOz, timeAgo, formatTime, ageLabel } from "@/lib/dates";
import { useAuthHeaders, filesUrl } from "@/lib/files";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

const FEEDING_LABELS: Record<string, string> = {
  BREAST_LEFT: "Breast (L)",
  BREAST_RIGHT: "Breast (R)",
  BOTTLE: "Bottle",
  SOLID: "Solid",
};

const DIAPER_LABELS: Record<string, string> = {
  WET: "Wet diaper",
  DIRTY: "Dirty diaper",
  BOTH: "Mixed diaper",
  DRY: "Dry diaper",
};

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

export default function BabyProfileScreen() {
  const { babyId } = useLocalSearchParams<{ babyId: string }>();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const authHeaders = useAuthHeaders();
  const { baby, isLoading, hasSection } = useBabyContext();

  const canLogs = hasSection("LOGS");
  const canHealth = hasSection("HEALTH");
  const canDoctorVisits = hasSection("DOCTOR_VISITS");
  const canPhotos = hasSection("PHOTOS");

  const { data: feedings } = useSWR(canLogs ? `/babies/${babyId}/feeding` : null, fetcher);
  const { data: diapers } = useSWR(canLogs ? `/babies/${babyId}/diapers` : null, fetcher);
  const { data: weightRecords } = useGrowthRecords(canHealth ? babyId : undefined, "WEIGHT");
  const { data: heightRecords } = useGrowthRecords(canHealth ? babyId : undefined, "HEIGHT");
  const { data: allBabies } = useBabies();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showDiaperModal, setShowDiaperModal] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>("7d");

  const chartDays = useMemo(() => daysForRange(chartRange), [chartRange]);
  const feedChartData = useMemo(() => bucketByDay(feedings ?? [], chartDays, feedingExtra), [feedings, chartDays]);
  const diaperChartData = useMemo(() => bucketByDay(diapers ?? [], chartDays), [diapers, chartDays]);
  const weightPoints = useMemo(() => toGrowthPoints(weightRecords ?? []), [weightRecords]);
  const heightPoints = useMemo(() => toGrowthPoints(heightRecords ?? []), [heightRecords]);
  const chartRangeOption = RANGE_OPTIONS.find((o) => o.value === chartRange) ?? RANGE_OPTIONS[2];

  const allEvents = useMemo(() => {
    const events: Array<{ id: string; kind: "feeding" | "diaper"; type: string; notes?: string | null; loggedAt: string }> =
      [
        ...(feedings?.map((f: FeedingLog) => ({ ...f, kind: "feeding" as const })) ?? []),
        ...(diapers?.map((d: DiaperLog) => ({ ...d, kind: "diaper" as const })) ?? []),
      ]
        .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
        .slice(0, 4);
    return events;
  }, [feedings, diapers]);

  async function refreshLogs() {
    const [freshFeedings, freshDiapers] = await Promise.all([
      mutate(`/babies/${babyId}/feeding`),
      mutate(`/babies/${babyId}/diapers`),
    ]);
    await mutate(`/babies/${babyId}`);
    if (baby) {
      await rescheduleReminder({
        babyId,
        babyName: baby.name,
        type: "feeding",
        intervalMinutes: baby.feedingReminderMinutes,
        lastLoggedAt: freshFeedings?.[0]?.loggedAt ?? null,
      });
      await rescheduleReminder({
        babyId,
        babyName: baby.name,
        type: "diaper",
        intervalMinutes: baby.diaperReminderMinutes,
        lastLoggedAt: freshDiapers?.[0]?.loggedAt ?? null,
      });
    }
  }

  async function handlePhotoUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("profilePhoto", {
      uri: asset.uri,
      name: asset.fileName ?? "photo.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as Blob);
    const res = await apiFetch(`/babies/${babyId}`, { method: "PATCH", body: formData });
    if (res.ok) {
      await mutate(`/babies/${babyId}`);
      await mutate("/babies");
      toast("Photo updated!", "success");
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Upload failed", "error");
    }
  }

  async function handleGalleryUpload() {
    setShowQuickAdd(false);
    // Give the Quick Add sheet's native modal time to finish dismissing —
    // presenting the image picker in the same tick races iOS's dismiss
    // animation and the picker can silently fail to appear.
    await new Promise((resolve) => setTimeout(resolve, 350));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const formData = new FormData();
    result.assets.forEach((asset, i) => {
      formData.append("files", {
        uri: asset.uri,
        name: asset.fileName ?? `photo-${i}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
    });
    const res = await apiFetch(`/babies/${babyId}/photos`, { method: "POST", body: formData });
    if (res.ok) {
      await mutate(`/babies/${babyId}/photos`);
      toast("Photo uploaded!", "success");
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Upload failed", "error");
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Spinner />
      </View>
    );
  }
  if (!baby) return null;

  const photoSrc = baby.profilePhoto ? filesUrl(baby.profilePhoto) : undefined;
  const fullName = [baby.firstName, baby.lastName].filter(Boolean).join(" ") || baby.name;

  const lastFeeding: FeedingLog | undefined = feedings?.[0];
  const today = new Date().toDateString();
  const diapersToday = diapers?.filter((d: DiaperLog) => new Date(d.loggedAt).toDateString() === today).length ?? 0;
  const lastDiaper: DiaperLog | undefined = diapers?.[0];

  const latestWeight = weightRecords?.[0];
  const latestHeight = heightRecords?.[0];

  const feedingsToday: FeedingLog[] =
    feedings?.filter((f: FeedingLog) => new Date(f.loggedAt).toDateString() === today) ?? [];
  let bottleMlToday = 0;
  let breastMinToday = 0;
  feedingsToday.forEach((f) => {
    if (f.type === "BOTTLE" && f.amount) {
      bottleMlToday += f.unit === "oz" ? f.amount * 29.5735 : f.amount;
    }
    if ((f.type === "BREAST_LEFT" || f.type === "BREAST_RIGHT") && f.duration) {
      breastMinToday += f.unit === "hr" ? f.duration * 60 : f.duration;
    }
  });

  const babiesCount = allBabies?.length ?? 1;

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={handlePhotoUpload} style={styles.avatarWrap}>
          <Avatar src={photoSrc} headers={authHeaders} name={fullName} size={60} />
          <View style={[styles.avatarOverlay, { borderColor: colors.pink[100] + "99" }]}>
            <AvatarCameraDotIcon color={colors.foreground} />
          </View>
        </Pressable>
        <View>
          <Pressable onPress={() => router.push("/(app)/dashboard")} style={styles.nameRow}>
            <Text style={[textStyles.babyName, { color: colors.foreground }]}>{fullName}</Text>
            <ChevronIcon direction="right" size={16} strokeWidth={1.8} color={colors.foreground + "66"} />
          </Pressable>
          <Text style={[styles.ageText, { color: colors.foreground + "80" }]}>
            {ageLabel(baby.birthDate)}
            {babiesCount > 1 ? ` · ${babiesCount} babies` : ""}
          </Text>
        </View>
      </View>

      {/* Stats: logs */}
      {canLogs && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              icon={<BottleIcon color={colors.foreground + "66"} />}
              label="Last feed"
              value={lastFeeding ? timeAgo(lastFeeding.loggedAt) : undefined}
              subtitle={
                lastFeeding
                  ? `${FEEDING_LABELS[lastFeeding.type] ?? lastFeeding.type}${lastFeeding.notes ? ` · ${lastFeeding.notes}` : ""}`
                  : undefined
              }
              empty="No feeds yet"
            />
            <StatCard
              icon={<DiaperIcon color={colors.foreground + "66"} />}
              label="Diapers today"
              value={String(diapersToday)}
              subtitle={lastDiaper ? `Last ${timeAgo(lastDiaper.loggedAt)}` : undefined}
            />
          </View>
          <View style={styles.statGrid}>
            <StatCard
              icon={<BottleIcon color={colors.foreground + "66"} />}
              label="Total bottle feed today"
              value={bottleMlToday > 0 ? `${formatOz(bottleMlToday)} / ${formatMl(bottleMlToday)}` : "–"}
            />
            <StatCard
              icon={<ClockIcon color={colors.foreground + "66"} />}
              label="Total breast time today"
              value={breastMinToday > 0 ? formatMinutes(breastMinToday) : "–"}
            />
          </View>
        </>
      )}

      {/* Stats: health */}
      {canHealth && (
        <View style={styles.statGrid}>
          <StatCard
            icon={<ScaleIcon color={colors.foreground + "66"} />}
            label="Latest weight"
            value={latestWeight ? `${latestWeight.value} ${latestWeight.unit}` : undefined}
            subtitle={latestWeight ? timeAgo(latestWeight.recordedAt) : undefined}
            empty="No weight logged"
          />
          <StatCard
            icon={<RulerIcon color={colors.foreground + "66"} />}
            label="Latest height"
            value={latestHeight ? `${latestHeight.value} ${latestHeight.unit}` : undefined}
            subtitle={latestHeight ? timeAgo(latestHeight.recordedAt) : undefined}
            empty="No height logged"
          />
        </View>
      )}

      {/* Doctor visit CTA */}
      {canDoctorVisits && (
        <Pressable
          onPress={() => router.push(`/(app)/babies/${babyId}/doctor-visit` as never)}
          style={[styles.doctorBanner, { backgroundColor: colors.pink[500] }]}
        >
          <View style={styles.doctorIconChip}>
            <StethoscopeIcon />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.doctorTitle}>Prepare doctor visit</Text>
            <Text style={styles.doctorSubtitle}>View flagged items & photos</Text>
          </View>
          <BannerChevronIcon />
        </Pressable>
      )}

      {/* Trends */}
      {(canLogs || canHealth) && (
        <View style={styles.trendsSection}>
          <View style={styles.trendsHeader}>
            <Text style={[textStyles.sectionTitle, { color: colors.foreground }]}>Trends</Text>
            <View style={styles.rangeRow}>
              {RANGE_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => setChartRange(o.value)}
                  style={[
                    styles.rangeChip,
                    {
                      borderColor: colors.pink[100],
                      backgroundColor: chartRange === o.value ? colors.pink[500] : "#fff",
                    },
                  ]}
                >
                  <Text style={[styles.rangeChipLabel, { color: chartRange === o.value ? "#fff" : colors.foreground }]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {canLogs && (
            <>
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
            </>
          )}
          {canHealth && (
            <>
              <GrowthLineChart
                title="Weight"
                points={weightPoints}
                unit={latestWeight?.unit ?? "kg"}
                emptyLabel="No weight logged yet"
                color="#2a78d6"
              />
              <GrowthLineChart
                title="Height"
                points={heightPoints}
                unit={latestHeight?.unit ?? "cm"}
                emptyLabel="No height logged yet"
                color="#1baf7a"
              />
            </>
          )}
        </View>
      )}

      {/* Today at a glance */}
      {canLogs && allEvents.length > 0 && (
        <View style={styles.glanceSection}>
          <View style={styles.glanceHeader}>
            <Text style={[textStyles.sectionTitle, { color: colors.foreground }]}>Today at a glance</Text>
            <Link href={`/(app)/babies/${babyId}/feeding` as never} style={{ color: colors.foreground + "66", fontSize: 14 }}>
              View all
            </Link>
          </View>
          <View style={styles.eventList}>
            {allEvents.map((event) => (
              <View key={event.id + event.kind} style={[styles.eventRow, { borderColor: colors.pink[100] + "99" }]}>
                <View
                  style={[
                    styles.eventIconChip,
                    { backgroundColor: event.kind === "feeding" ? colors.pink[50] : "#fffbeb" },
                  ]}
                >
                  {event.kind === "feeding" ? (
                    <BottleIcon color={colors.pink[400]} />
                  ) : (
                    <DiaperIcon color="#f59e0b" />
                  )}
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.eventLabel, { color: colors.foreground }]}>
                    {event.kind === "feeding"
                      ? FEEDING_LABELS[event.type] ?? event.type
                      : DIAPER_LABELS[event.type] ?? event.type}
                  </Text>
                  {event.notes && (
                    <Text style={[styles.eventNotes, { color: colors.foreground + "80" }]} numberOfLines={1}>
                      {event.notes}
                    </Text>
                  )}
                </View>
                <View style={styles.eventTimeCol}>
                  <Text style={[styles.eventTime, { color: colors.foreground }]}>{formatTime(event.loggedAt)}</Text>
                  <Text style={[styles.eventTimeAgo, { color: colors.foreground + "66" }]}>
                    {timeAgo(event.loggedAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

    </ScrollView>

      {(canLogs || canPhotos) && (
        <Pressable onPress={() => setShowQuickAdd(true)} style={[styles.fab, { backgroundColor: colors.pink[500] }]}>
          <PlusIcon color="#fff" />
        </Pressable>
      )}

      <QuickAddModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        canLogs={canLogs}
        canPhotos={canPhotos}
        onLogFeed={() => {
          setShowQuickAdd(false);
          setShowFeedModal(true);
        }}
        onLogDiaper={() => {
          setShowQuickAdd(false);
          setShowDiaperModal(true);
        }}
        onUploadPhoto={handleGalleryUpload}
      />

      <FeedingFormModal
        open={showFeedModal}
        onClose={() => setShowFeedModal(false)}
        babyId={babyId}
        onSaved={refreshLogs}
        apiFetch={apiFetch}
      />
      <DiaperFormModal
        open={showDiaperModal}
        onClose={() => setShowDiaperModal(false)}
        babyId={babyId}
        onSaved={refreshLogs}
        apiFetch={apiFetch}
      />
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  empty,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  subtitle?: string;
  empty?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { borderColor: colors.pink[100] + "99" }]}>
      <View style={styles.statLabelRow}>
        {icon}
        <Text style={[styles.statLabel, { color: colors.foreground + "66" }]}>{label}</Text>
      </View>
      {value ? (
        <>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
          {subtitle && <Text style={[styles.statSubtitle, { color: colors.foreground + "80" }]}>{subtitle}</Text>}
        </>
      ) : (
        <Text style={[styles.statEmpty, { color: colors.foreground + "66" }]}>{empty}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { maxWidth: 512, width: "100%", alignSelf: "center", padding: 16, paddingBottom: 96, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { position: "relative" },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ageText: { fontSize: 14, marginTop: 2 },
  statGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 16 },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  statLabel: { fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.4 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statSubtitle: { fontSize: 12, marginTop: 2 },
  statEmpty: { fontSize: 14 },
  doctorBanner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16 },
  doctorIconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: { flex: 1 },
  doctorTitle: { color: "#fff", fontWeight: "600", fontSize: 14 },
  doctorSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  trendsSection: { gap: 12 },
  trendsHeader: { gap: 8 },
  rangeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  rangeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  rangeChipLabel: { fontSize: 12, fontWeight: "500" },
  glanceSection: {},
  glanceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  eventList: { gap: 8 },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  eventIconChip: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eventLabel: { fontSize: 14, fontWeight: "500" },
  eventNotes: { fontSize: 12, marginTop: 1 },
  eventTimeCol: { alignItems: "flex-end" },
  eventTime: { fontSize: 14, fontWeight: "500" },
  eventTimeAgo: { fontSize: 12 },
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
