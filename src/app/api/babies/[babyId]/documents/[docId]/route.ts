import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { deleteFile } from "@/lib/upload";

type Params = { params: Promise<{ babyId: string; docId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, docId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const existing = await db.medicalDocument.findUnique({ where: { id: docId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  await deleteFile(existing.path).catch(() => {});
  await db.medicalDocument.delete({ where: { id: docId } });
  return new NextResponse(null, { status: 204 });
}
