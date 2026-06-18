"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-pink-100 flex z-40">
      {items.map((item) => (
        <Link key={item.href} href={item.href}
          className={cn("flex-1 flex flex-col items-center justify-center py-3 text-xs gap-1 transition-colors",
            pathname === item.href || (item.href === "/settings" && pathname.startsWith("/settings"))
              ? "text-pink-500"
              : "text-pink-300 hover:text-pink-500"
          )}>
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
