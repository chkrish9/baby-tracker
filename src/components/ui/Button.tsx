import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary:   "bg-pink-500 hover:bg-pink-600 text-white",
      secondary: "bg-white hover:bg-pink-50 text-foreground border border-pink-100",
      outline:   "border border-pink-200 hover:border-pink-300 text-foreground bg-transparent",
      ghost:     "hover:bg-pink-50 text-foreground",
      danger:    "bg-red-100 hover:bg-red-200 text-red-700",
    };
    const sizes = { sm: "text-sm px-4 py-2", md: "text-sm px-5 py-2.5", lg: "text-base px-6 py-3" };
    return (
      <button ref={ref} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading && <span className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
