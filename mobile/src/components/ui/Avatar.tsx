import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { avatarPalette } from "@/theme/tokens";

interface AvatarProps {
  src?: string | null;
  headers?: Record<string, string>;
  name?: string | null;
  size?: number;
  colorIndex?: number;
}

function pickColor(name?: string | null, colorIndex?: number): string {
  if (colorIndex !== undefined) return avatarPalette[colorIndex % avatarPalette.length];
  if (!name) return avatarPalette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export function Avatar({ src, headers, name, size = 40, colorIndex }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (src) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={{ uri: src, headers }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      </View>
    );
  }

  const bg = pickColor(name, colorIndex);

  return (
    <View
      style={[
        styles.container,
        styles.initials,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.38, fontWeight: "600" }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flexShrink: 0,
  },
  initials: {
    alignItems: "center",
    justifyContent: "center",
  },
});
