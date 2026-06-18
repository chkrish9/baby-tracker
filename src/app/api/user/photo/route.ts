import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/auth-helpers";
import { saveFile, deleteFile } from "@/lib/upload";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Must be an image" }, { status: 415 });

  const existing = await db.user.findUnique({ where: { id: session.user.id }, select: { profilePhoto: true } });
  if (existing?.profilePhoto) await deleteFile(existing.profilePhoto).catch(() => {});

  const relativePath = await saveFile(file, `users/${session.user.id}/profile`);
  const user = await db.user.update({
    where: { id: session.user.id },
    data: { profilePhoto: relativePath },
    select: { profilePhoto: true },
  });

  return NextResponse.json(user);
}
