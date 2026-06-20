import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-2xl border border-pink-100 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
