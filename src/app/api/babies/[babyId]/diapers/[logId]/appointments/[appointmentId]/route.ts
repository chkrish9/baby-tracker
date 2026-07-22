import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";

type Params = { params: Promise<{ babyId: string; logId: string; appointmentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, logId, appointmentId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const log = await db.diaperLog.findUnique({ where: { id: logId } });
  if (!log || log.babyId !== babyId) return notFound();

  await db.diaperAppointment.deleteMany({ where: { diaperLogId: logId, appointmentId } });
  return new NextResponse(null, { status: 204 });
}
