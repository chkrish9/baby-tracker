import { ActivityIndicator } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function Spinner({ size = 20 }: { size?: number }) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size <= 20 ? "small" : "large"} color={colors.pink[300]} />;
}
