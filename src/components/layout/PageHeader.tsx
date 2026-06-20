import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backHref?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, action, backHref, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-4", className)}>
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white border border-pink-100/60 text-foreground hover:bg-pink-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">{title}</h1>
          {subtitle && <p className="text-sm text-foreground/50 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
