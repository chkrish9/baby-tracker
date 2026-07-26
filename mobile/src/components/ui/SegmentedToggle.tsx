import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radii } from "@/theme/tokens";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string>({ options, value, onChange }: SegmentedToggleProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              {
                borderColor: active ? colors.pink[400] : colors.pink[100],
                backgroundColor: active ? colors.pink[50] : "transparent",
              },
            ]}
          >
            <Text style={[styles.label, { color: active ? colors.pink[700] : colors.foreground + "99" }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});
