import { Pressable, StyleSheet, Text, View } from "react-native";
import { CheckIcon } from "@/components/icons";
import { Section, SECTIONS } from "@/lib/sections";
import { useTheme } from "@/theme/ThemeContext";

interface SectionPermissionsPickerProps {
  value: Set<Section>;
  onChange: (next: Set<Section>) => void;
}

export function SectionPermissionsPicker({ value, onChange }: SectionPermissionsPickerProps) {
  const { colors } = useTheme();

  function toggle(section: Section) {
    const next = new Set(value);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    onChange(next);
  }

  return (
    <View style={styles.list}>
      {SECTIONS.map((section) => {
        const checked = value.has(section.key);
        return (
          <Pressable
            key={section.key}
            onPress={() => toggle(section.key)}
            style={[styles.row, { backgroundColor: colors.pink[50] + "80" }]}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: checked ? colors.pink[500] : colors.pink[200], backgroundColor: checked ? colors.pink[500] : "transparent" },
              ]}
            >
              {checked && <CheckIcon size={11} strokeWidth={3} />}
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: colors.foreground }]}>{section.label}</Text>
              <Text style={[styles.description, { color: colors.foreground + "80" }]} numberOfLines={1}>
                {section.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1, minWidth: 0 },
  label: { fontSize: 14, fontWeight: "500" },
  description: { fontSize: 12, marginTop: 1 },
});
