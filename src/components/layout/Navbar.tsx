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
    <header className="flex items-center justify-between px-4 py-3 bg-background border-b border-pink-100/60 sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Little Notes" width={34} height={34} className="rounded-xl" />
        <span className="font-bold text-foreground text-lg font-serif tracking-tight">Little Notes</span>
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-pink-200"
        >
          <Avatar src={photoSrc} name={displayName} size={36} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-pink-100/60 py-1.5 z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-pink-100/60">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-foreground/40 truncate">{session?.user?.email}</p>
            </div>
            <Link href="/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-pink-50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6l6-4 6 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              Switch baby
            </Link>
            <Link href="/babies/new" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-pink-50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Add baby
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-pink-50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.2 3.2l.7.7M12.1 12.1l.7.7M12.8 3.2l-.7.7M3.9 12.1l-.7.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Settings
            </Link>
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 8H3M7 5l-3 3 3 3M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
