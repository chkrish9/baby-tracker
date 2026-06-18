import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { saveFile } from "@/lib/upload";

type Params = { params: Promise<{ babyId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const photos = await db.babyPhoto.findMany({ where: { babyId }, orderBy: { takenAt: "desc" } });
  return NextResponse.json(photos);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const results = [];
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: `${file.name} exceeds 10 MB` }, { status: 413 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: `${file.name} is not an image` }, { status: 415 });

    const relativePath = await saveFile(file, `babies/${babyId}/photos`);
    const photo = await db.babyPhoto.create({
      data: { babyId, path: relativePath, filename: file.name, size: file.size, mimeType: file.type },
    });
    results.push(photo);
  }

  return NextResponse.json(results, { status: 201 });
}
