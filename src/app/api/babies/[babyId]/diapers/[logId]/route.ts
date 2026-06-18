import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { diaperUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string; logId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, logId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = diaperUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const existing = await db.diaperLog.findUnique({ where: { id: logId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  const log = await db.diaperLog.update({ where: { id: logId }, data: parsed.data });
  return NextResponse.json(log);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, logId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const existing = await db.diaperLog.findUnique({ where: { id: logId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  await db.diaperLog.delete({ where: { id: logId } });
  return new NextResponse(null, { status: 204 });
}
