import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path: segments } = await params;
  const joined = segments.join("/");

  // Block path traversal
  if (joined.includes("..") || joined.includes("\0")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const abs = path.join(process.cwd(), "uploads", joined);
  const normalizedRoot = path.join(process.cwd(), "uploads");
  if (!abs.startsWith(normalizedRoot)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = Buffer.from(await fs.readFile(abs));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType = mime.lookup(abs) || "application/octet-stream";
  const body = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  return new NextResponse(body, { headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" } });
}
