import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { doctorNoteCreateSchema } from "@/lib/validation";
import { findNextAppointmentId } from "@/lib/appointments";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const { searchParams } = new URL(req.url);
  const where: Prisma.DoctorNoteWhereInput = { babyId };
  const appointmentId = searchParams.get("appointmentId");
  if (appointmentId === "unassigned") where.appointmentId = null;
  else if (appointmentId) where.appointmentId = appointmentId;

  const notes = await db.doctorNote.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(notes);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = doctorNoteCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const data = { ...parsed.data };
  if (data.appointmentId === undefined) {
    data.appointmentId = await findNextAppointmentId(babyId);
  }

  const note = await db.doctorNote.create({ data: { babyId, ...data } });
  return NextResponse.json(note, { status: 201 });
}
