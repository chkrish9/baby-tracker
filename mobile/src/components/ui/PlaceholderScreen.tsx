// Temporary placeholder for screens not yet built out in the current phase —
// replaced with the real screen implementation in its scheduled build phase.
import { ScrollView, Text } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function PlaceholderScreen({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ color: colors.foreground + "80", fontSize: 14 }}>{title} — coming soon</Text>
    </ScrollView>
  );
}
