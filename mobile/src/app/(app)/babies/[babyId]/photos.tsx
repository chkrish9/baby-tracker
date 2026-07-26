import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSWRConfig } from "swr";
import { CameraLargeIcon, PlusIcon } from "@/components/icons";
import { FlagAppointmentsModal } from "@/components/doctor-visit/FlagAppointmentsModal";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { Photo, usePhotos } from "@/hooks/usePhotos";
import { apiFetch } from "@/lib/apiClient";
import { useTheme } from "@/theme/ThemeContext";
import { textStyles } from "@/theme/typography";

export default function PhotosScreen() {
  const { babyId } = useLocalSearchParams<{ babyId: string }>();
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: photos, isLoading } = usePhotos(babyId);

  const [flaggingPhoto, setFlaggingPhoto] = useState<Photo | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  async function handleUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const formData = new FormData();
    result.assets.forEach((asset, i) => {
      formData.append("files", {
        uri: asset.uri,
        name: asset.fileName ?? `photo-${i}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
    });
    const res = await apiFetch(`/babies/${babyId}/photos`, { method: "POST", body: formData });
    if (res.ok) {
      await mutate(`/babies/${babyId}/photos`);
      toast("Photos uploaded!", "success");
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Upload failed", "error");
    }
  }

  function handleDelete(photo: Photo) {
    Alert.alert("Delete photo?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/babies/${babyId}/photos/${photo.id}`, { method: "DELETE" });
          if (res.ok) {
            await mutate(`/babies/${babyId}/photos`);
            toast("Photo deleted", "success");
          } else {
            toast("Failed to delete", "error");
          }
        },
      },
    ]);
  }

  async function handleSaveFlags(photoId: string, appointmentIds: string[]) {
    const res = await apiFetch(`/babies/${babyId}/photos/${photoId}/appointments`, {
      method: "PUT",
      body: JSON.stringify({ appointmentIds }),
    });
    if (res.ok) {
      await mutate(`/babies/${babyId}/photos`);
      toast(appointmentIds.length === 0 ? "Unflagged" : "Flagged for the doctor", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={[textStyles.pageTitle, { color: colors.foreground }]}>Photos</Text>
        <Button size="sm" onPress={handleUpload}>
          <View style={styles.uploadLabel}>
            <PlusIcon size={14} strokeWidth={1.8} color="#fff" />
            <Text style={styles.uploadText}>Upload</Text>
          </View>
        </Button>
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <Spinner />
        </View>
      )}

      {!isLoading && (
        <View style={styles.content}>
          {!photos?.length ? (
            <Pressable onPress={handleUpload} style={[styles.emptyState, { borderColor: colors.pink[200] }]}>
              <CameraLargeIcon color={colors.foreground + "4D"} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Add your first photo</Text>
              <Text style={[styles.emptySubtitle, { color: colors.foreground + "66" }]}>
                Capture milestones, rashes, or diaper photos to show at the next visit.
              </Text>
            </Pressable>
          ) : (
            <PhotoGrid
              photos={photos}
              onPress={setViewerIndex}
              onFlag={setFlaggingPhoto}
              onDelete={handleDelete}
            />
          )}
        </View>
      )}

      <FlagAppointmentsModal
        open={!!flaggingPhoto}
        onClose={() => setFlaggingPhoto(null)}
        babyId={babyId}
        currentAppointmentIds={flaggingPhoto?.appointmentIds ?? []}
        onSave={(appointmentIds) => handleSaveFlags(flaggingPhoto!.id, appointmentIds)}
      />

      {viewerIndex !== null && photos && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxWidth: 512, width: "100%", alignSelf: "center", paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 },
  uploadLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  uploadText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  loading: { paddingVertical: 48, alignItems: "center" },
  content: { paddingHorizontal: 16 },
  emptyState: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { fontSize: 14, fontWeight: "500" },
  emptySubtitle: { fontSize: 12, textAlign: "center" },
});
