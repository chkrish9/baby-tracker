import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { inviteCreateSchema } from "@/lib/validation";
import { addDays } from "@/lib/utils";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const parents = await db.babyParent.findMany({
    where: { babyId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(parents);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = inviteCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const { email } = parsed.data;

  const existing = await db.babyParent.findFirst({
    where: { babyId, user: { email } },
  });
  if (existing) return NextResponse.json({ error: "User is already a parent" }, { status: 409 });

  const pendingInvite = await db.invite.findFirst({
    where: { babyId, email, status: "PENDING" },
  });
  if (pendingInvite) return NextResponse.json({ error: "Invite already sent to this email" }, { status: 409 });

  const invite = await db.invite.create({
    data: { babyId, invitedByUserId: session.user.id, email, expiresAt: addDays(new Date(), 7) },
  });

  return NextResponse.json({ token: invite.token, email: invite.email }, { status: 201 });
}
