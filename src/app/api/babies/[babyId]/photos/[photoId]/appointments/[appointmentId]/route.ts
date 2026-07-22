import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";

type Params = { params: Promise<{ babyId: string; photoId: string; appointmentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, photoId, appointmentId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const photo = await db.babyPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.babyId !== babyId) return notFound();

  await db.photoAppointment.deleteMany({ where: { photoId, appointmentId } });
  return new NextResponse(null, { status: 204 });
}
