import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/apiClient";
import { BabyProvider } from "@/lib/BabyContext";
import { useTheme } from "@/theme/ThemeContext";

// Mirrors web/src/app/(app)/babies/[babyId]/layout.tsx: verify access before
// rendering any nested baby screen.
export default function BabyLayout() {
  const { babyId } = useLocalSearchParams<{ babyId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAllowed(false);
    apiFetch(`/babies/${babyId}`).then((res) => {
      if (cancelled) return;
      if (res.status === 401) {
        router.replace("/(auth)/login");
        return;
      }
      if (!res.ok) {
        router.replace("/(app)/dashboard");
        return;
      }
      setAllowed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [babyId, router]);

  if (!allowed) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Spinner />
      </View>
    );
  }

  return (
    <BabyProvider babyId={babyId}>
      <Stack screenOptions={{ headerShown: false }} />
    </BabyProvider>
  );
}
