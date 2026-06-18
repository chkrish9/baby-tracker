import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized, forbidden, assertParentOf } from "@/lib/auth-helpers";
import { saveFile } from "@/lib/upload";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

type Params = { params: Promise<{ babyId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const { babyId } = await params;
  try { await assertParentOf(session.user.id, babyId); } catch { return forbidden(); }

  const docs = await db.medicalDocument.findMany({ where: { babyId }, orderBy: { uploadedAt: "desc" } });
  return NextResponse.json(docs);
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
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: `${file.name}: unsupported file type` }, { status: 415 });

    const relativePath = await saveFile(file, `babies/${babyId}/documents`);
    const doc = await db.medicalDocument.create({
      data: { babyId, path: relativePath, originalName: file.name, size: file.size, mimeType: file.type },
    });
    results.push(doc);
  }

  return NextResponse.json(results, { status: 201 });
}
