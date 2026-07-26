import { ReactNode } from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radii, shadows } from "@/theme/tokens";

export function Card({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        shadows.sm,
        { backgroundColor: "#fff", borderColor: colors.pink[100] + "99" },
        style,
      ]}
      {...props}
    />
  );
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props} />;
}

export function CardTitle({ children, style }: { children: ReactNode; style?: object }) {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.foreground }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
});
