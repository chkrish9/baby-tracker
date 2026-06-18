import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  if (src) {
    return (
      <div className={cn("rounded-full overflow-hidden bg-pink-100 flex-shrink-0", className)} style={{ width: size, height: size }}>
        {/* Plain <img> — needed because next/image proxies via server-side optimizer
            which doesn't carry the user's session cookie for /api/files/ routes */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name ?? "avatar"} className="object-cover w-full h-full" />
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full bg-pink-200 flex items-center justify-center text-pink-700 font-semibold flex-shrink-0", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
