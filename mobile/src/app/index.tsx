import { Redirect } from "expo-router";
import { View } from "react-native";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/theme/ThemeContext";

export default function Index() {
  const { status } = useAuth();
  const { colors } = useTheme();

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Spinner />
      </View>
    );
  }

  return <Redirect href={status === "signedIn" ? "/(app)/dashboard" : "/(auth)/login"} />;
}
