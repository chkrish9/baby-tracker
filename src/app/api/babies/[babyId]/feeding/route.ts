import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { feedingCreateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const logs = await db.feedingLog.findMany({ where: { babyId }, orderBy: { loggedAt: "desc" }, take: 50 });
  return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = feedingCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const log = await db.feedingLog.create({ data: { babyId, ...parsed.data } });
  return NextResponse.json(log, { status: 201 });
}
