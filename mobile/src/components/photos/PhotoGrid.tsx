import { Image } from "expo-image";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { FlagIcon, TrashIcon } from "@/components/icons";
import { Photo } from "@/hooks/usePhotos";
import { filesUrl, useAuthHeaders } from "@/lib/files";
import { formatBytes } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeContext";

const GRID_GAP = 12;
const GRID_PADDING = 16;

interface PhotoGridProps {
  photos: Photo[];
  onPress: (index: number) => void;
  onFlag: (photo: Photo) => void;
  onDelete: (photo: Photo) => void;
}

export function PhotoGrid({ photos, onPress, onFlag, onDelete }: PhotoGridProps) {
  const { colors } = useTheme();
  const authHeaders = useAuthHeaders();
  const screenWidth = Dimensions.get("window").width;
  const cellSize = (Math.min(screenWidth, 512) - GRID_PADDING * 2 - GRID_GAP) / 2;

  return (
    <View style={styles.grid}>
      {photos.map((photo, i) => {
        const flagged = photo.appointmentIds.length > 0;
        return (
          <Pressable
            key={photo.id}
            onPress={() => onPress(i)}
            style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: colors.pink[50], borderColor: colors.pink[100] + "99" }]}
          >
            <Image
              source={{ uri: filesUrl(photo.path), headers: authHeaders }}
              style={styles.image}
              contentFit="cover"
            />
            {flagged && (
              <View style={[styles.flagBadge, { backgroundColor: colors.pink[500] }]}>
                <FlagIcon size={13} filled color="#fff" />
              </View>
            )}
            <View style={styles.bottomBar}>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onFlag(photo);
                  }}
                  style={[styles.actionButton, flagged ? { backgroundColor: colors.pink[500] } : styles.actionButtonNeutral]}
                >
                  <FlagIcon size={14} filled={flagged} color={flagged ? "#fff" : colors.foreground + "99"} />
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete(photo);
                  }}
                  style={[styles.actionButton, styles.actionButtonNeutral]}
                >
                  <TrashIcon size={14} color="#ef4444" />
                </Pressable>
              </View>
              <Text style={styles.sizeLabel}>{formatBytes(photo.size)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  cell: { borderRadius: 16, borderWidth: 1, overflow: "hidden", position: "relative" },
  image: { width: "100%", height: "100%" },
  flagBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  actionRow: { flexDirection: "row", gap: 6 },
  actionButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionButtonNeutral: { backgroundColor: "rgba(255,255,255,0.85)" },
  sizeLabel: { color: "#fff", fontSize: 11 },
});
