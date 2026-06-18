import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth-helpers";
import { babyCreateSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const babies = await db.baby.findMany({
    where: { parents: { some: { userId: session.user.id } } },
    include: { parents: { include: { user: { select: { id: true, name: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(babies);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = babyCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const baby = await db.baby.create({
    data: {
      name: parsed.data.name,
      birthDate: parsed.data.birthDate,
      parents: { create: { userId: session.user.id, role: "OWNER" } },
    },
    include: { parents: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });

  return NextResponse.json(baby, { status: 201 });
}
