"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedOut, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isLoggedOut) router.replace("/login");
  }, [isLoggedOut, isLoading, router]);

  if (isLoading || !user) return null;

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
