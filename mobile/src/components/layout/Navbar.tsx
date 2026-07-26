import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { AddBabyIcon, NavSettingsIcon, SignOutIcon, SwitchBabyIcon } from "@/components/icons";
import { useAuthHeaders, filesUrl } from "@/lib/files";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/theme/ThemeContext";
import { fixedColors } from "@/theme/tokens";
import { textStyles } from "@/theme/typography";

const logo = require("../../../assets/images/icon.png");

export function Navbar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: userSettings } = useCurrentUser();
  const authHeaders = useAuthHeaders();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const photoSrc = userSettings?.profilePhoto ? filesUrl(userSettings.profilePhoto) : undefined;
  const displayName = userSettings?.name ?? userSettings?.email ?? null;

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.replace("/(auth)/login");
  }

  function go(href: string) {
    setOpen(false);
    router.push(href as never);
  }

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.pink[100] + "99", paddingTop: insets.top + 12 }]}>
      <Pressable style={styles.brand} onPress={() => router.push("/(app)/dashboard")}>
        <Image source={logo} style={styles.logo} contentFit="cover" />
        <Text style={[textStyles.modalTitle, { fontSize: 18, color: colors.foreground }]}>Little Notes</Text>
      </Pressable>

      <Pressable onPress={() => setOpen(true)}>
        <Avatar src={photoSrc} headers={authHeaders} name={displayName} size={36} />
      </Pressable>

      <Modal open={open} onClose={() => setOpen(false)}>
        <View style={[styles.menuHeader, { borderBottomColor: colors.pink[100] + "99" }]}>
          <Text style={[styles.menuName, { color: colors.foreground }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.menuEmail, { color: colors.foreground + "66" }]} numberOfLines={1}>
            {userSettings?.email}
          </Text>
        </View>
        <MenuRow icon={<SwitchBabyIcon color={colors.foreground} />} label="Switch baby" onPress={() => go("/(app)/dashboard")} />
        <MenuRow icon={<AddBabyIcon color={colors.foreground} />} label="Add baby" onPress={() => go("/(app)/babies/new")} />
        <MenuRow icon={<NavSettingsIcon color={colors.foreground} />} label="Settings" onPress={() => go("/(app)/settings")} />
        <MenuRow
          icon={<SignOutIcon color={fixedColors.red[500]} />}
          label="Sign out"
          labelColor={fixedColors.red[500]}
          onPress={handleSignOut}
        />
      </Modal>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  labelColor,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      {icon}
      <Text style={[styles.menuRowText, { color: labelColor ?? colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 12,
  },
  menuHeader: {
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  menuName: {
    fontSize: 14,
    fontWeight: "600",
  },
  menuEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  menuRowText: {
    fontSize: 14,
  },
});
