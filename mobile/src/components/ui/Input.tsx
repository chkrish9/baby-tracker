import { forwardRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { radii } from "@/theme/tokens";

export const Input = forwardRef<TextInput, TextInputProps>(({ style, onFocus, onBlur, ...props }, ref) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.foreground + "4D"}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          borderColor: focused ? colors.pink[400] : colors.pink[100],
          color: colors.foreground,
          backgroundColor: "#fff",
        },
        style,
      ]}
      {...props}
    />
  );
});
Input.displayName = "Input";

const styles = StyleSheet.create({
  input: {
    width: "100%",
    borderRadius: radii["2xl"],
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
});
