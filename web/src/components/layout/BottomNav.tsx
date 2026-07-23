"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useBabies } from "@/hooks/useBaby";
import { useBabyPermissions } from "@/hooks/usePermissions";

function DashboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="2" width="8" height="8" rx="2" />
      <rect x="12" y="2" width="8" height="8" rx="2" />
      <rect x="2" y="12" width="8" height="8" rx="2" />
      <rect x="12" y="12" width="8" height="8" rx="2" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L11 3l8 7.5" />
      <path d="M5 9v9a1 1 0 001 1h10a1 1 0 001-1V9" />
      <path d="M8.5 19v-5.5a1 1 0 011-1h3a1 1 0 011 1V19" />
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

function HealthIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M11 4l6.5 6.5c1.8 1.8 1.8 4.7 0 6.5s-4.7 1.8-6.5 0L11 17l0 0-6.5-6.5c-1.8-1.8-1.8-4.7 0-6.5s4.7-1.8 6.5 0z" />
      <path d="M8 11h2l1-2 2 4 1-2h2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6" />
      <circle cx="11" cy="11" r="2.2" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(45 11 11)" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(90 11 11)" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(135 11 11)" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(180 11 11)" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(225 11 11)" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(270 11 11)" />
      <rect x="10" y="2.6" width="2" height="2.6" rx="0.4" transform="rotate(315 11 11)" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const { data: babies } = useBabies();
  const hasBabies = babies === undefined ? true : babies.length > 0;
  const { hasSection } = useBabyPermissions(activeBabyId ?? "");

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
  const isHealth = !!activeBabyId && pathname.startsWith(`/babies/${activeBabyId}/health`);
  const isSettings = pathname.startsWith("/settings");

  const dashHref = activeBabyId ? `/babies/${activeBabyId}` : "/dashboard";
  const logsHref = activeBabyId ? `/babies/${activeBabyId}/feeding` : "/dashboard";
  const photosHref = activeBabyId ? `/babies/${activeBabyId}/photos` : "/dashboard";
  const healthHref = activeBabyId ? `/babies/${activeBabyId}/health` : "/dashboard";

  const items = [
    { href: dashHref, label: hasBabies ? "Dashboard" : "Home", icon: hasBabies ? <DashboardIcon /> : <HomeIcon />, active: isDashboard },
    ...(hasBabies
      ? [
          ...(hasSection("LOGS") ? [{ href: logsHref, label: "Logs", icon: <LogsIcon />, active: isLogs }] : []),
          ...(hasSection("PHOTOS") ? [{ href: photosHref, label: "Photos", icon: <PhotosIcon />, active: isPhotos }] : []),
          ...(hasSection("HEALTH") ? [{ href: healthHref, label: "Health", icon: <HealthIcon />, active: isHealth }] : []),
        ]
      : []),
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
