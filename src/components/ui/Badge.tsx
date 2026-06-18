import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "pink" | "mint" | "butter" | "sky";
}

export function Badge({ className, variant = "pink", ...props }: BadgeProps) {
  const variants = {
    pink: "bg-pink-100 text-pink-700",
    mint: "bg-[#e1f7ee] text-emerald-700",
    butter: "bg-[#fff6dd] text-amber-700",
    sky: "bg-[#e6f3ff] text-blue-700",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant], className)} {...props} />;
}
