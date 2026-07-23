import { db } from "./db";

export async function findNextAppointmentId(babyId: string): Promise<string | null> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const appointment = await db.doctorAppointment.findFirst({
    where: { babyId, date: { gte: startOfToday } },
    orderBy: { date: "asc" },
  });
  return appointment?.id ?? null;
}
