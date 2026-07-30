import { Redirect, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, View } from "react-native";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Navbar } from "@/components/layout/Navbar";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth";
import { registerNotificationResponseListener, resyncAllReminders } from "@/lib/notifications";
import { useTheme } from "@/theme/ThemeContext";

export default function AppLayout() {
  const { status } = useAuth();
  const { colors } = useTheme();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (status !== "signedIn") return;

    resyncAllReminders();
    const { remove: removeResponseListener } = registerNotificationResponseListener();

    const handleAppStateChange = (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        resyncAllReminders();
      }
      appState.current = next;
    };
    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      removeResponseListener();
      appStateSubscription.remove();
    };
  }, [status]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Spinner />
      </View>
    );
  }

  if (status === "signedOut") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <BottomTabBar />
    </View>
  );
}
