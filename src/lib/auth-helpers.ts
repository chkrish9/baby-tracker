import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function getSession() {
  return auth();
}

export async function assertParentOf(userId: string, babyId: string) {
  const link = await db.babyParent.findUnique({ where: { userId_babyId: { userId, babyId } } });
  if (!link) throw new Error("Forbidden");
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
