import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BackChevronIcon } from "@/components/icons";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, action, onBack }: PageHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            style={[styles.backButton, { backgroundColor: "#fff", borderColor: colors.pink[100] + "99" }]}
          >
            <BackChevronIcon color={colors.foreground} />
          </Pressable>
        )}
        <View>
          <Text style={[textStyles.pageTitle, { color: colors.foreground }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: colors.foreground + "80" }]}>{subtitle}</Text>}
        </View>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
