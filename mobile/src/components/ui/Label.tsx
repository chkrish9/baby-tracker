import { Text, TextProps } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function Label({ style, ...props }: TextProps) {
  const { colors } = useTheme();
  return <Text style={[{ fontSize: 14, fontWeight: "500", color: colors.foreground, marginBottom: 4 }, style]} {...props} />;
}
