import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { appointmentLinksSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string; photoId: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, photoId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = appointmentLinksSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const photo = await db.babyPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.babyId !== babyId) return notFound();

  const uniqueIds = Array.from(new Set(parsed.data.appointmentIds));
  if (uniqueIds.length > 0) {
    const validCount = await db.doctorAppointment.count({ where: { id: { in: uniqueIds }, babyId } });
    if (validCount !== uniqueIds.length) return NextResponse.json({ error: "Invalid appointment selection" }, { status: 400 });
  }

  await db.$transaction([
    db.photoAppointment.deleteMany({ where: { photoId } }),
    ...(uniqueIds.length > 0
      ? [db.photoAppointment.createMany({ data: uniqueIds.map((appointmentId) => ({ photoId, appointmentId })) })]
      : []),
  ]);

  return NextResponse.json({ appointmentIds: uniqueIds });
}
