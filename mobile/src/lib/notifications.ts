import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { apiFetch } from "@/lib/apiClient";
import { Baby } from "@/types/baby";

export type ReminderType = "diaper" | "feeding";

const REMINDER_PREFIX = "reminder-";

function repeatId(babyId: string, type: ReminderType): string {
  return `${type}-reminder-${babyId}`;
}

function catchupId(babyId: string, type: ReminderType): string {
  return `${type}-reminder-catchup-${babyId}`;
}

const REMINDER_COPY: Record<ReminderType, { title: string; body: (name?: string) => string }> = {
  diaper: {
    title: "Diaper check",
    body: (name) => `It's been a while since ${name ?? "baby"}'s last diaper change.`,
  },
  feeding: {
    title: "Feeding time?",
    body: (name) => `It's been a while since ${name ?? "baby"}'s last feeding.`,
  },
};

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Reminders",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function rescheduleReminder(params: {
  babyId: string;
  babyName?: string;
  type: ReminderType;
  intervalHours: number | null | undefined;
  lastLoggedAt: string | null | undefined;
}): Promise<void> {
  const { babyId, babyName, type, intervalHours, lastLoggedAt } = params;
  const rId = repeatId(babyId, type);
  const cId = catchupId(babyId, type);

  await Notifications.cancelScheduledNotificationAsync(rId).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(cId).catch(() => {});

  if (!intervalHours || !lastLoggedAt) return;

  const copy = REMINDER_COPY[type];
  const intervalMs = intervalHours * 3600 * 1000;
  const overdue = Date.now() >= new Date(lastLoggedAt).getTime() + intervalMs;

  if (overdue) {
    await Notifications.scheduleNotificationAsync({
      identifier: cId,
      content: {
        title: copy.title,
        body: copy.body(babyName),
        data: { babyId, type },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: rId,
    content: {
      title: copy.title,
      body: copy.body(babyName),
      data: { babyId, type },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: intervalHours * 3600,
      repeats: true,
    },
  });
}

export async function rescheduleBabyReminders(baby: Baby): Promise<void> {
  const [feedings, diapers] = await Promise.all([
    apiFetch(`/babies/${baby.id}/feeding`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    apiFetch(`/babies/${baby.id}/diapers`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);

  await rescheduleReminder({
    babyId: baby.id,
    babyName: baby.name,
    type: "feeding",
    intervalHours: baby.feedingReminderHours,
    lastLoggedAt: feedings?.[0]?.loggedAt ?? null,
  });
  await rescheduleReminder({
    babyId: baby.id,
    babyName: baby.name,
    type: "diaper",
    intervalHours: baby.diaperReminderHours,
    lastLoggedAt: diapers?.[0]?.loggedAt ?? null,
  });
}

export async function cancelBabyReminders(babyId: string): Promise<void> {
  const ids = [
    repeatId(babyId, "diaper"),
    repeatId(babyId, "feeding"),
    catchupId(babyId, "diaper"),
    catchupId(babyId, "feeding"),
  ];
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

export async function resyncAllReminders(): Promise<void> {
  const babies: Baby[] = await apiFetch("/babies")
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);

  const validIds = new Set<string>();
  for (const baby of babies) {
    validIds.add(repeatId(baby.id, "diaper"));
    validIds.add(repeatId(baby.id, "feeding"));
    validIds.add(catchupId(baby.id, "diaper"));
    validIds.add(catchupId(baby.id, "feeding"));
    await rescheduleBabyReminders(baby);
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const orphaned = scheduled.filter(
    (n) => n.identifier.includes(REMINDER_PREFIX) && !validIds.has(n.identifier)
  );
  await Promise.all(
    orphaned.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
  );
}

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as { babyId?: string; type?: ReminderType } | undefined;
  if (!data?.babyId) return;
  const path =
    data.type === "diaper"
      ? (`/(app)/babies/${data.babyId}/feeding?tab=diaper` as never)
      : (`/(app)/babies/${data.babyId}/feeding` as never);
  router.push(path);
}

export function registerNotificationResponseListener(): { remove: () => void } {
  const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleNotificationResponse(response);
  });

  return { remove: () => subscription.remove() };
}
