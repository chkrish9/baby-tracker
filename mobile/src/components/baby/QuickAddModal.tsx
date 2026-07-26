import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottleIcon, CameraIcon, DiaperIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { fixedColors } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeContext";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  canLogs: boolean;
  canPhotos: boolean;
  onLogFeed: () => void;
  onLogDiaper: () => void;
  onUploadPhoto: () => void;
}

export function QuickAddModal({ open, onClose, canLogs, canPhotos, onLogFeed, onLogDiaper, onUploadPhoto }: QuickAddModalProps) {
  const { colors } = useTheme();

  return (
    <Modal open={open} onClose={onClose} title="Quick add">
      <View style={styles.list}>
        {canLogs && (
          <>
            <Row
              bg={colors.pink[500]}
              icon={<BottleIcon color="#fff" />}
              label="Log feed"
              rowBg={colors.pink[50] + "80"}
              onPress={onLogFeed}
            />
            <Row
              bg={fixedColors.amber[500]}
              icon={<DiaperIcon color="#fff" />}
              label="Log diaper"
              rowBg={colors.pink[50] + "80"}
              onPress={onLogDiaper}
            />
          </>
        )}
        {canPhotos && (
          <Row
            bg={fixedColors.sky500}
            icon={<CameraIcon color="#fff" />}
            label="Upload photo"
            rowBg={colors.pink[50] + "80"}
            onPress={onUploadPhoto}
          />
        )}
      </View>
    </Modal>
  );
}

function Row({
  bg,
  icon,
  label,
  rowBg,
  onPress,
}: {
  bg: string;
  icon: React.ReactNode;
  label: string;
  rowBg: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: rowBg }]}>
      <View style={[styles.iconChip, { backgroundColor: bg }]}>{icon}</View>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});
