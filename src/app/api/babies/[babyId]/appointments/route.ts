import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { appointmentCreateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const appointments = await db.doctorAppointment.findMany({ where: { babyId }, orderBy: { date: "desc" } });
  return NextResponse.json(appointments);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = appointmentCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const appointment = await db.doctorAppointment.create({ data: { babyId, ...parsed.data } });
  return NextResponse.json(appointment, { status: 201 });
}
