import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block h-5 w-5 border-2 border-pink-300 border-t-transparent rounded-full animate-spin", className)} />
  );
}
