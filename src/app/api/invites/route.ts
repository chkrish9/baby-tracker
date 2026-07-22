import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden } from "@/lib/auth-helpers";
import { inviteCreateSchema } from "@/lib/validation";
import { addDays } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = inviteCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const { email, babyIds } = parsed.data;
  const uniqueBabyIds = Array.from(new Set(babyIds));

  const myLinks = await db.babyParent.findMany({ where: { userId: session.user.id, babyId: { in: uniqueBabyIds } } });
  const isOwnerOfAll = myLinks.length === uniqueBabyIds.length && myLinks.every((l) => l.role === "OWNER");
  if (!isOwnerOfAll) return forbidden();

  const alreadyParentOf = await db.babyParent.findMany({ where: { babyId: { in: uniqueBabyIds }, user: { email } } });
  const alreadyParentBabyIds = new Set(alreadyParentOf.map((l) => l.babyId));
  const targetBabyIds = uniqueBabyIds.filter((id) => !alreadyParentBabyIds.has(id));

  if (targetBabyIds.length === 0) {
    return NextResponse.json({ error: "This person already has access to the selected baby/babies" }, { status: 409 });
  }

  const invite = await db.invite.create({
    data: {
      invitedByUserId: session.user.id,
      email,
      expiresAt: addDays(new Date(), 7),
      babies: { create: targetBabyIds.map((babyId) => ({ babyId })) },
    },
  });

  return NextResponse.json({ token: invite.token, email: invite.email }, { status: 201 });
}
