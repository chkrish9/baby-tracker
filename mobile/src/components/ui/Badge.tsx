import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { fixedColors, radii } from "@/theme/tokens";

export type BadgeVariant = "pink" | "mint" | "butter" | "sky";

export function Badge({ children, variant = "pink" }: { children: ReactNode; variant?: BadgeVariant }) {
  const { colors } = useTheme();
  const variants: Record<BadgeVariant, { bg: string; text: string }> = {
    pink: { bg: colors.pink[100], text: colors.pink[700] },
    mint: { bg: fixedColors.mint[100], text: fixedColors.emerald[700] },
    butter: { bg: fixedColors.butter[100], text: fixedColors.amber[500] },
    sky: { bg: fixedColors.sky[100], text: fixedColors.sky500 },
  };
  const v = variants[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
