import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { appointmentUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string; appointmentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, appointmentId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const appointment = await db.doctorAppointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.babyId !== babyId) return notFound();

  return NextResponse.json(appointment);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, appointmentId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = appointmentUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const existing = await db.doctorAppointment.findUnique({ where: { id: appointmentId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  const appointment = await db.doctorAppointment.update({ where: { id: appointmentId }, data: parsed.data });
  return NextResponse.json(appointment);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, appointmentId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const existing = await db.doctorAppointment.findUnique({ where: { id: appointmentId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  await db.doctorAppointment.delete({ where: { id: appointmentId } });
  return new NextResponse(null, { status: 204 });
}
