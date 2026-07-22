import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { vaccinationUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string; vaccinationId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, vaccinationId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const vaccination = await db.vaccination.findUnique({ where: { id: vaccinationId } });
  if (!vaccination || vaccination.babyId !== babyId) return notFound();

  return NextResponse.json(vaccination);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, vaccinationId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = vaccinationUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const existing = await db.vaccination.findUnique({ where: { id: vaccinationId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  const vaccination = await db.vaccination.update({ where: { id: vaccinationId }, data: parsed.data });
  return NextResponse.json(vaccination);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, vaccinationId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const existing = await db.vaccination.findUnique({ where: { id: vaccinationId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  await db.vaccination.delete({ where: { id: vaccinationId } });
  return new NextResponse(null, { status: 204 });
}
