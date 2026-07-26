import { router, usePathname } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DashboardIcon,
  HealthIcon,
  HomeIcon,
  LogsIcon,
  PhotosIcon,
  SettingsIcon,
} from "@/components/icons";
import { useActiveBaby } from "@/hooks/useActiveBaby";
import { useBabies } from "@/hooks/useBaby";
import { useSectionAccess } from "@/hooks/useSectionAccess";
import { useTheme } from "@/theme/ThemeContext";
import { radii } from "@/theme/tokens";

interface TabItem {
  key: string;
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}

// Direct port of web/src/components/layout/BottomNav.tsx (including the
// Home/Dashboard label-swap fix already applied there this session).
export function BottomTabBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const activeBabyId = useActiveBaby();
  const { data: babies } = useBabies();
  const hasBabies = babies === undefined ? true : babies.length > 0;
  const { hasSection } = useSectionAccess(activeBabyId ?? undefined);

  const isBabiesListPage = pathname === "/dashboard";
  const isDashboard = pathname === "/dashboard" || (!!activeBabyId && pathname === `/babies/${activeBabyId}`);
  const isLogs =
    !!activeBabyId &&
    (pathname.startsWith(`/babies/${activeBabyId}/feeding`) || pathname.startsWith(`/babies/${activeBabyId}/diapers`));
  const isPhotos = !!activeBabyId && pathname.startsWith(`/babies/${activeBabyId}/photos`);
  const isHealth = !!activeBabyId && pathname.startsWith(`/babies/${activeBabyId}/health`);
  const isSettings = pathname.startsWith("/settings");

  const dashHref = activeBabyId ? `/babies/${activeBabyId}` : "/dashboard";
  const logsHref = activeBabyId ? `/babies/${activeBabyId}/feeding` : "/dashboard";
  const photosHref = activeBabyId ? `/babies/${activeBabyId}/photos` : "/dashboard";
  const healthHref = activeBabyId ? `/babies/${activeBabyId}/health` : "/dashboard";

  const iconColor = colors.foreground;

  const items: TabItem[] = [
    {
      key: "home",
      href: dashHref,
      label: isBabiesListPage ? "Home" : "Dashboard",
      icon: isBabiesListPage ? <HomeIcon color={iconColor} /> : <DashboardIcon color={iconColor} />,
      active: isDashboard,
    },
    ...(hasBabies && !isBabiesListPage
      ? [
          ...(hasSection("LOGS")
            ? [{ key: "logs", href: logsHref, label: "Logs", icon: <LogsIcon color={iconColor} />, active: isLogs }]
            : []),
          ...(hasSection("PHOTOS")
            ? [{ key: "photos", href: photosHref, label: "Photos", icon: <PhotosIcon color={iconColor} />, active: isPhotos }]
            : []),
          ...(hasSection("HEALTH")
            ? [{ key: "health", href: healthHref, label: "Health", icon: <HealthIcon color={iconColor} />, active: isHealth }]
            : []),
        ]
      : []),
    { key: "settings", href: "/settings", label: "Settings", icon: <SettingsIcon color={iconColor} />, active: isSettings },
  ];

  return (
    <View
      style={[
        styles.nav,
        { backgroundColor: "#fff", borderTopColor: colors.pink[100] + "99", paddingBottom: insets.bottom },
      ]}
    >
      {items.map((item) => (
        <Pressable key={item.key} style={styles.item} onPress={() => router.push(item.href as never)}>
          <View
            style={[
              styles.iconPill,
              item.active && { backgroundColor: colors.pink[100] + "CC" },
            ]}
          >
            {item.icon}
          </View>
          <Text
            style={[
              styles.label,
              { color: item.active ? colors.foreground : colors.foreground + "66" },
              item.active && styles.labelActive,
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 2,
  },
  iconPill: {
    width: 44,
    height: 28,
    borderRadius: radii["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
  },
  labelActive: {
    fontWeight: "500",
  },
});
