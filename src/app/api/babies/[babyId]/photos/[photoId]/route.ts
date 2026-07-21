import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { deleteFile } from "@/lib/upload";
import { photoUpdateSchema } from "@/lib/validation";
import { findNextAppointmentId } from "@/lib/appointments";

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

  const data = { ...parsed.data };
  if (data.flagged === true && data.appointmentId === undefined) {
    data.appointmentId = await findNextAppointmentId(babyId);
  } else if (data.flagged === false && data.appointmentId === undefined) {
    data.appointmentId = null;
  }

  const photo = await db.babyPhoto.update({ where: { id: photoId }, data });
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
