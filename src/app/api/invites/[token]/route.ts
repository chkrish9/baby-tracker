import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth-helpers";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const invite = await db.invite.findUnique({
    where: { token },
    include: { baby: { select: { id: true, name: true } }, invitedBy: { select: { name: true, email: true } } },
  });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired or already used" }, { status: 410 });
  }
  return NextResponse.json({ baby: invite.baby, invitedBy: invite.invitedBy, email: invite.email });
}

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { token } = await params;

  const invite = await db.invite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired or already used" }, { status: 410 });
  }

  const existing = await db.babyParent.findUnique({
    where: { userId_babyId: { userId: session.user.id, babyId: invite.babyId } },
  });
  if (existing) {
    await db.invite.update({ where: { token }, data: { status: "ACCEPTED" } });
    return NextResponse.json({ babyId: invite.babyId });
  }

  await db.$transaction([
    db.babyParent.create({ data: { userId: session.user.id, babyId: invite.babyId, role: "PARENT" } }),
    db.invite.update({ where: { token }, data: { status: "ACCEPTED" } }),
  ]);

  return NextResponse.json({ babyId: invite.babyId });
}
