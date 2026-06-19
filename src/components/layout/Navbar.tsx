"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Navbar() {
  const { data: session } = useSession();
  const { data: userSettings } = useSWR(session ? "/api/user/settings" : null, fetcher);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    function keyHandler(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", keyHandler); };
  }, [open]);

  async function handleSignOut() {
    localStorage.removeItem("rm");
    sessionStorage.removeItem("rm");
    await signOut({ redirect: false });
    router.replace("/login");
  }

  const photoSrc = userSettings?.profilePhoto ? `/api/files/${userSettings.profilePhoto}` : undefined;
  const displayName = userSettings?.name ?? session?.user?.name ?? session?.user?.email;

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-pink-100 sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-pink-600 text-base sm:text-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Baby Tracker logo" width={30} height={30} className="rounded-lg" />
        <span>Baby Tracker</span>
      </Link>

      {/* Profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setOpen((v) => !v)} className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-pink-200">
          <Avatar src={photoSrc} name={displayName} size={34} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-pink-100 py-1 z-50">
            <div className="px-4 py-3 border-b border-pink-100">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-foreground/50 truncate">{session?.user?.email}</p>
            </div>
            <Link href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-pink-50 transition-colors">
              ⚙️ Settings
            </Link>
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-pink-50 transition-colors">
              🚪 Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
