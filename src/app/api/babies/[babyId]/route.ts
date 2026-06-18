import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound, assertParentOf } from "@/lib/auth-helpers";
import { babyUpdateSchema } from "@/lib/validation";
import { saveFile, deleteFile } from "@/lib/upload";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;

  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const baby = await db.baby.findUnique({
    where: { id: babyId },
    include: { parents: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  if (!baby) return notFound();
  return NextResponse.json(baby);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;

  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("profilePhoto") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large" }, { status: 413 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Must be an image" }, { status: 415 });

    const existing = await db.baby.findUnique({ where: { id: babyId }, select: { profilePhoto: true } });
    if (existing?.profilePhoto) await deleteFile(existing.profilePhoto).catch(() => {});

    const relativePath = await saveFile(file, `babies/${babyId}/profile`);
    const baby = await db.baby.update({ where: { id: babyId }, data: { profilePhoto: relativePath } });
    return NextResponse.json(baby);
  }

  const body = await req.json().catch(() => null);
  const parsed = babyUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const baby = await db.baby.update({ where: { id: babyId }, data: parsed.data });
  return NextResponse.json(baby);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;

  const link = await db.babyParent.findUnique({ where: { userId_babyId: { userId: session.user.id, babyId } } });
  if (!link) return forbidden();
  if (link.role !== "OWNER") return NextResponse.json({ error: "Only the owner can delete this baby" }, { status: 403 });

  await db.baby.delete({ where: { id: babyId } });
  return new NextResponse(null, { status: 204 });
}
