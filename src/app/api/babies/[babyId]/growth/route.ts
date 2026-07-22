import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { growthRecordCreateSchema } from "@/lib/validation";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const type = typeParam === "WEIGHT" || typeParam === "HEIGHT" ? typeParam : undefined;

  const records = await db.growthRecord.findMany({ where: { babyId, type }, orderBy: { recordedAt: "desc" } });
  return NextResponse.json(records);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const body = await req.json().catch(() => null);
  const parsed = growthRecordCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const record = await db.growthRecord.create({ data: { babyId, ...parsed.data } });
  return NextResponse.json(record, { status: 201 });
}
