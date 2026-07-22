"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth="1.6">
      <rect x="2" y="2" width="8" height="8" rx="2" />
      <rect x="12" y="2" width="8" height="8" rx="2" />
      <rect x="2" y="12" width="8" height="8" rx="2" />
      <rect x="12" y="12" width="8" height="8" rx="2" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="2" width="14" height="18" rx="2.5" />
      <path d="M8 7h6M8 11h6M8 15h4" strokeLinecap="round" />
    </svg>
  );
}

function PhotosIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="5" width="18" height="14" rx="2.5" />
      <path d="M6 5V4a2 2 0 012-2h6a2 2 0 012 2v1" />
      <circle cx="11" cy="12" r="2.5" />
      <path d="M7 18l1.5-2a2.5 2.5 0 014 0L14 18" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="3" />
      <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.41 1.41M16.37 16.37l1.41 1.41M4.22 17.78l1.41-1.41M16.37 5.63l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/babies\/([^/]+)/);
    if (match?.[1]) {
      localStorage.setItem("activeBabyId", match[1]);
      setActiveBabyId(match[1]);
    } else {
      setActiveBabyId(localStorage.getItem("activeBabyId"));
    }
  }, [pathname]);

  const isDashboard = pathname === "/dashboard" || (!!activeBabyId && pathname === `/babies/${activeBabyId}`);
  const isLogs = !!activeBabyId && (pathname.startsWith(`/babies/${activeBabyId}/feeding`) || pathname.startsWith(`/babies/${activeBabyId}/diapers`));
  const isPhotos = !!activeBabyId && (pathname.startsWith(`/babies/${activeBabyId}/documents`) || pathname.startsWith(`/babies/${activeBabyId}/photos`));
  const isSettings = pathname.startsWith("/settings");

  const dashHref = activeBabyId ? `/babies/${activeBabyId}` : "/dashboard";
  const logsHref = activeBabyId ? `/babies/${activeBabyId}/feeding` : "/dashboard";
  const photosHref = activeBabyId ? `/babies/${activeBabyId}/photos` : "/dashboard";

  const items = [
    { href: dashHref, label: "Dashboard", icon: <DashboardIcon active={isDashboard} />, active: isDashboard },
    { href: logsHref, label: "Logs", icon: <LogsIcon />, active: isLogs },
    { href: photosHref, label: "Photos", icon: <PhotosIcon />, active: isPhotos },
    { href: "/settings", label: "Settings", icon: <SettingsIcon />, active: isSettings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-pink-100/60 flex z-40 pb-safe">
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs transition-colors",
            item.active ? "text-foreground font-medium" : "text-foreground/40 hover:text-foreground/60"
          )}
        >
          <span className={cn(
            "flex items-center justify-center rounded-2xl transition-all w-11 h-7",
            item.active ? "bg-pink-100/80" : ""
          )}>
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
