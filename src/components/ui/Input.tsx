import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-foreground placeholder:text-pink-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
