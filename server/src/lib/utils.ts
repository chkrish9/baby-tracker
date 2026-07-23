export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function babyDisplayName(baby: { firstName?: string | null; lastName?: string | null; nickname?: string | null }): string {
  const nickname = baby.nickname?.trim();
  if (nickname) return nickname;
  return [baby.firstName, baby.lastName].filter(Boolean).join(" ").trim();
}
