import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth-helpers";
import { userSettingsSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, theme: true, profilePhoto: true },
  });
  if (!user) return unauthorized();
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = userSettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });

  const user = await db.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { name: true, email: true, theme: true, profilePhoto: true },
  });
  return NextResponse.json(user);
}
