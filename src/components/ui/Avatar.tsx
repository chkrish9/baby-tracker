import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  colorIndex?: number;
}

const AVATAR_COLORS = [
  { bg: "#7090B5", text: "#fff" },
  { bg: "#B87860", text: "#fff" },
  { bg: "#6B8FA0", text: "#fff" },
  { bg: "#8B7BB5", text: "#fff" },
  { bg: "#4A6741", text: "#fff" },
  { bg: "#A07850", text: "#fff" },
];

function pickColor(name?: string | null, colorIndex?: number) {
  if (colorIndex !== undefined) return AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({ src, name, size = 40, className, colorIndex }: AvatarProps) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  if (src) {
    return (
      <div className={cn("rounded-full overflow-hidden flex-shrink-0", className)} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name ?? "avatar"} className="object-cover w-full h-full" />
      </div>
    );
  }

  const color = pickColor(name, colorIndex);

  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold flex-shrink-0", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: color.bg, color: color.text }}
    >
      {initials}
    </div>
  );
}
