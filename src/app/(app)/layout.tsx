"use client";
import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.replace("/login"); return; }
    const hasRm = localStorage.getItem("rm") === "1" || sessionStorage.getItem("rm") === "1";
    if (!hasRm) signOut({ redirect: false }).then(() => router.replace("/login"));
  }, [session, status, router]);

  if (status === "loading" || !session) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pb-24">{children}</main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
