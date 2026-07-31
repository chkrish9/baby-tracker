import { db } from "./db";
import { sendPushToBabyParents } from "./push";
import { babyDisplayName } from "./utils";

const CHECK_INTERVAL_MS = 60_000;

type ReminderType = "diaper" | "feeding";

const REMINDER_COPY: Record<ReminderType, { title: string; body: (name: string) => string; url: (babyId: string) => string }> = {
  diaper: {
    title: "Diaper check",
    body: (name) => `It's been a while since ${name}'s last diaper change.`,
    url: (babyId) => `/babies/${babyId}/diapers`,
  },
  feeding: {
    title: "Feeding time?",
    body: (name) => `It's been a while since ${name}'s last feeding.`,
    url: (babyId) => `/babies/${babyId}/feeding`,
  },
};

async function checkReminder(params: {
  babyId: string;
  babyName: string;
  type: ReminderType;
  intervalMinutes: number | null;
  lastLoggedAt: Date | null;
  lastReminderSentAt: Date | null;
}): Promise<void> {
  const { babyId, babyName, type, intervalMinutes, lastLoggedAt, lastReminderSentAt } = params;
  if (!intervalMinutes || !lastLoggedAt) return;

  const intervalMs = intervalMinutes * 60 * 1000;
  const baseline = Math.max(lastLoggedAt.getTime(), lastReminderSentAt?.getTime() ?? 0);
  if (Date.now() < baseline + intervalMs) return;

  const copy = REMINDER_COPY[type];
  await sendPushToBabyParents(babyId, {
    title: copy.title,
    body: copy.body(babyName),
    url: copy.url(babyId),
  });

  await db.baby.update({
    where: { id: babyId },
    data:
      type === "diaper"
        ? { lastDiaperReminderSentAt: new Date() }
        : { lastFeedingReminderSentAt: new Date() },
  });
}

async function tick(): Promise<void> {
  const babies = await db.baby.findMany({
    where: {
      OR: [{ diaperReminderMinutes: { not: null } }, { feedingReminderMinutes: { not: null } }],
    },
    include: {
      feedings: { take: 1, orderBy: { loggedAt: "desc" } },
      diapers: { take: 1, orderBy: { loggedAt: "desc" } },
    },
  });

  for (const baby of babies) {
    const babyName = babyDisplayName(baby);
    await checkReminder({
      babyId: baby.id,
      babyName,
      type: "diaper",
      intervalMinutes: baby.diaperReminderMinutes,
      lastLoggedAt: baby.diapers[0]?.loggedAt ?? null,
      lastReminderSentAt: baby.lastDiaperReminderSentAt,
    });
    await checkReminder({
      babyId: baby.id,
      babyName,
      type: "feeding",
      intervalMinutes: baby.feedingReminderMinutes,
      lastLoggedAt: baby.feedings[0]?.loggedAt ?? null,
      lastReminderSentAt: baby.lastFeedingReminderSentAt,
    });
  }
}

export function startReminderScheduler(): void {
  setInterval(() => {
    tick().catch((err) => console.error("reminderScheduler tick failed:", err));
  }, CHECK_INTERVAL_MS);
}
