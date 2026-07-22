import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { diaperCreateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const { searchParams } = new URL(req.url);
  const where: Prisma.DiaperLogWhereInput = { babyId };
  const appointmentId = searchParams.get("appointmentId");
  if (appointmentId === "unassigned") where.appointmentLinks = { none: {} };
  else if (appointmentId) where.appointmentLinks = { some: { appointmentId } };
  else if (searchParams.get("flagged") === "true") where.appointmentLinks = { some: {} };

  const logs = await db.diaperLog.findMany({
    where,
    orderBy: { loggedAt: "desc" },
    take: 500,
    include: { appointmentLinks: { select: { appointmentId: true } } },
  });
  const result = logs.map(({ appointmentLinks, ...log }) => ({
    ...log,
    appointmentIds: appointmentLinks.map((l) => l.appointmentId),
  }));
  return NextResponse.json(result);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = diaperCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const log = await db.diaperLog.create({ data: { babyId, ...parsed.data } });
  return NextResponse.json(log, { status: 201 });
}
