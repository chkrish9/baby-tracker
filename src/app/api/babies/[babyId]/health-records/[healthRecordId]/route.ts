import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { healthRecordUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string; healthRecordId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, healthRecordId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const record = await db.healthRecord.findUnique({ where: { id: healthRecordId } });
  if (!record || record.babyId !== babyId) return notFound();

  return NextResponse.json(record);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, healthRecordId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = healthRecordUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const existing = await db.healthRecord.findUnique({ where: { id: healthRecordId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  const record = await db.healthRecord.update({ where: { id: healthRecordId }, data: parsed.data });
  return NextResponse.json(record);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, healthRecordId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const existing = await db.healthRecord.findUnique({ where: { id: healthRecordId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  await db.healthRecord.delete({ where: { id: healthRecordId } });
  return new NextResponse(null, { status: 204 });
}
