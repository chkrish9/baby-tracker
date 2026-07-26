import { Image } from "expo-image";
import { useRef } from "react";
import { GestureResponderEvent, Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { CloseIcon, LightboxChevronIcon } from "@/components/icons";
import { Photo } from "@/hooks/usePhotos";
import { filesUrl, useAuthHeaders } from "@/lib/files";

interface PhotoLightboxProps {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onNavigate }: PhotoLightboxProps) {
  const authHeaders = useAuthHeaders();
  const photo = photos[index];
  const startX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        startX.current = e.nativeEvent.pageX;
      },
      onPanResponderRelease: (e: GestureResponderEvent) => {
        const delta = e.nativeEvent.pageX - startX.current;
        if (Math.abs(delta) > 50 && photos.length > 1) {
          if (delta > 0) onNavigate((index - 1 + photos.length) % photos.length);
          else onNavigate((index + 1) % photos.length);
        }
      },
    })
  ).current;

  if (!photo) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} {...panResponder.panHandlers}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Pressable onPress={onClose} style={[styles.iconButton, styles.closeButton]}>
          <CloseIcon color="#fff" />
        </Pressable>

        {photos.length > 1 && (
          <Pressable
            onPress={() => onNavigate((index - 1 + photos.length) % photos.length)}
            style={[styles.iconButton, styles.prevButton]}
          >
            <LightboxChevronIcon direction="left" color="#fff" />
          </Pressable>
        )}

        <Image
          source={{ uri: filesUrl(photo.path), headers: authHeaders }}
          style={styles.image}
          contentFit="contain"
          pointerEvents="none"
        />

        {photos.length > 1 && (
          <Pressable
            onPress={() => onNavigate((index + 1) % photos.length)}
            style={[styles.iconButton, styles.nextButton]}
          >
            <LightboxChevronIcon direction="right" color="#fff" />
          </Pressable>
        )}

        {photos.length > 1 && (
          <View style={styles.counter} pointerEvents="none">
            <Text style={styles.counterText}>
              {index + 1} / {photos.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "90%", height: "80%" },
  iconButton: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: { top: 48, right: 16 },
  prevButton: { left: 16, top: "50%", marginTop: -20 },
  nextButton: { right: 16, top: "50%", marginTop: -20 },
  counter: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  counterText: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
});
