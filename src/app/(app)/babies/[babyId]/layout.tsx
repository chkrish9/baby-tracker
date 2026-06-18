import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function BabyLayout({ children, params }: { children: React.ReactNode; params: Promise<{ babyId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { babyId } = await params;
  const link = await db.babyParent.findUnique({ where: { userId_babyId: { userId: session.user.id, babyId } } });
  if (!link) redirect("/dashboard");

  return <>{children}</>;
}
