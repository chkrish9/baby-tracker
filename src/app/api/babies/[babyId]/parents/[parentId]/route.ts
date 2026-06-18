import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, notFound } from "@/lib/auth-helpers";

type Params = { params: Promise<{ babyId: string; parentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId, parentId } = await params;

  const requesterLink = await db.babyParent.findUnique({ where: { userId_babyId: { userId: session.user.id, babyId } } });
  if (!requesterLink) return forbidden();

  const targetLink = await db.babyParent.findUnique({ where: { id: parentId } });
  if (!targetLink || targetLink.babyId !== babyId) return notFound();

  if (targetLink.role === "OWNER") return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
  if (requesterLink.role !== "OWNER" && targetLink.userId !== session.user.id) return forbidden();

  await db.babyParent.delete({ where: { id: parentId } });
  return new NextResponse(null, { status: 204 });
}
