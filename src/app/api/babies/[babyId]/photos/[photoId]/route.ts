import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { deleteFile } from "@/lib/upload";
import { photoUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string; photoId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, photoId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = photoUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await db.babyPhoto.findUnique({ where: { id: photoId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  const photo = await db.babyPhoto.update({ where: { id: photoId }, data: parsed.data });
  return NextResponse.json(photo);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, photoId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const existing = await db.babyPhoto.findUnique({ where: { id: photoId } });
  if (!existing || existing.babyId !== babyId) return notFound();

  await deleteFile(existing.path).catch(() => {});
  await db.babyPhoto.delete({ where: { id: photoId } });
  return new NextResponse(null, { status: 204 });
}
