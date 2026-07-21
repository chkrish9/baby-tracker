import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { doctorNoteUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string; noteId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, noteId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = doctorNoteUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const existing = await db.doctorNote.findUnique({ where: { id: noteId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  const note = await db.doctorNote.update({ where: { id: noteId }, data: parsed.data });
  return NextResponse.json(note);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, noteId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const existing = await db.doctorNote.findUnique({ where: { id: noteId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  await db.doctorNote.delete({ where: { id: noteId } });
  return new NextResponse(null, { status: 204 });
}
