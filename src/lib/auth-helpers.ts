import { auth } from "@/auth";
import { decode } from "@auth/core/jwt";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function getSession() {
  // Try cookie-based session first (web app)
  const session = await auth();
  if (session?.user?.id) return session;

  // Fall back to Bearer token (mobile app)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = await decode({
        token,
        secret: process.env.AUTH_SECRET!,
        salt: "authjs.session-token",
      });
      if (payload?.id) {
        return {
          user: {
            id: payload.id as string,
            email: (payload.email as string | undefined) ?? "",
            name: (payload.name as string | null | undefined) ?? null,
          },
        };
      }
    } catch {
      // Invalid token — fall through to return null
    }
  }

  return null;
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
