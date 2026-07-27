import { ReactNode } from "react";
import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { fixedColors, radii } from "@/theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: object;
  children?: ReactNode;
}

const SIZE_STYLES: Record<ButtonSize, { paddingHorizontal: number; paddingVertical: number; fontSize: number }> = {
  sm: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  md: { paddingHorizontal: 20, paddingVertical: 10, fontSize: 14 },
  lg: { paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 },
};

// JSX like `+ {someString}` produces an array of strings, not a single
// string — RN requires ALL bare text (including each array entry) to be
// wrapped in a <Text>, so plain `typeof children === "string"` isn't enough.
function isTextLike(node: ReactNode): boolean {
  if (node == null || typeof node === "boolean") return true;
  if (typeof node === "string" || typeof node === "number") return true;
  if (Array.isArray(node)) return node.every(isTextLike);
  return false;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, { bg: string; bgPressed: string; text: string; border?: string }> = {
    primary: { bg: colors.pink[500], bgPressed: colors.pink[600], text: "#fff" },
    secondary: { bg: "#fff", bgPressed: colors.pink[50], text: colors.foreground, border: colors.pink[100] },
    outline: { bg: "transparent", bgPressed: colors.pink[50], text: colors.foreground, border: colors.pink[200] },
    ghost: { bg: "transparent", bgPressed: colors.pink[50], text: colors.foreground },
    danger: { bg: fixedColors.red[100], bgPressed: fixedColors.red[100], text: fixedColors.red[700] },
  };
  const v = variantStyles[variant];
  const s = SIZE_STYLES[size];

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isDisabled ? v.bgPressed : v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          paddingHorizontal: s.paddingHorizontal,
          paddingVertical: s.paddingVertical,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={v.text} style={styles.spinner} />}
      {isTextLike(children) ? (
        <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii["2xl"],
  },
  text: {
    fontWeight: "500",
  },
  spinner: {
    marginRight: 8,
  },
});
