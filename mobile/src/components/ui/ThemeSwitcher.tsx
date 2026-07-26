import { Pressable, StyleSheet, Text, View } from "react-native";
import { CheckIcon } from "@/components/icons";
import { useTheme } from "@/theme/ThemeContext";
import { ThemeName } from "@/theme/tokens";

const THEME_SWATCHES: { id: ThemeName; label: string; color: string }[] = [
  { id: "sage", label: "Sage", color: "#4A6741" },
  { id: "clay", label: "Clay", color: "#7D5240" },
  { id: "ocean", label: "Ocean", color: "#3F7299" },
  { id: "plum", label: "Plum", color: "#6B50A0" },
];

export function ThemeSwitcher({ showLabels }: { showLabels?: boolean }) {
  const { themeName, setThemeName, colors } = useTheme();

  return (
    <View style={styles.row}>
      {THEME_SWATCHES.map((t) => {
        const selected = themeName === t.id;
        return (
          <Pressable key={t.id} onPress={() => setThemeName(t.id)} style={styles.item}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: t.color },
                selected && {
                  transform: [{ scale: 1.1 }],
                  borderWidth: 2,
                  borderColor: colors.foreground + "4D",
                },
              ]}
            >
              {selected && <CheckIcon />}
            </View>
            {showLabels && (
              <Text
                style={[
                  styles.label,
                  { color: selected ? colors.foreground : colors.foreground + "80", fontWeight: selected ? "600" : "400" },
                ]}
              >
                {t.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  item: {
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
  },
});
