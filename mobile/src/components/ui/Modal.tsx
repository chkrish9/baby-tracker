import { ReactNode, useEffect } from "react";
import { Modal as RNModal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeContext";
import { radii, shadows } from "@/theme/tokens";
import { textStyles } from "@/theme/typography";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

// Matches web's Modal.tsx: always a bottom sheet, never a centered dialog —
// bg-black/40 backdrop, rounded-t-3xl sheet, drag-handle bar, slide-up.
export function Modal({ open, onClose, title, children }: ModalProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: 350,
      easing: Easing.bezier(0.34, 1.2, 0.64, 1),
    });
  }, [open, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 400 }],
  }));

  if (!open) return null;

  return (
    <RNModal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, shadows.xl, { backgroundColor: "#fff" }, sheetStyle]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.foreground + "26" }]} />
          </View>
          {title && (
            <View style={styles.titleRow}>
              <Text style={[textStyles.modalTitle, { color: colors.foreground }]}>{title}</Text>
            </View>
          )}
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: radii["3xl"],
    borderTopRightRadius: radii["3xl"],
    width: "100%",
    maxHeight: "90%",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
  },
  titleRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});
