import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import useSWR, { useSWRConfig } from "swr";
import { CheckIcon, FlagIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/apiClient";
import { filesUrl, useAuthHeaders } from "@/lib/files";
import { useTheme } from "@/theme/ThemeContext";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

interface DoctorNoteItem {
  id: string;
  question: string;
  answered: boolean;
  createdAt: string;
}
interface Photo {
  id: string;
  path: string;
  filename: string;
  size: number;
  appointmentIds: string[];
}
interface DiaperLogItem {
  id: string;
  type: string;
  notes?: string | null;
  appointmentIds: string[];
  loggedAt: string;
}

const DIAPER_LABELS: Record<string, string> = {
  WET: "Wet diaper",
  DIRTY: "Dirty diaper",
  BOTH: "Mixed diaper",
  DRY: "Dry diaper",
};

interface VisitPrepProps {
  babyId: string;
  appointmentId: string | null;
}

export function VisitPrep({ babyId, appointmentId }: VisitPrepProps) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const authHeaders = useAuthHeaders();
  const scope = appointmentId ?? "unassigned";

  const notesKey = `/babies/${babyId}/doctor-notes?appointmentId=${scope}`;
  const photosKey = `/babies/${babyId}/photos?flagged=true&appointmentId=${scope}`;
  const diapersKey = `/babies/${babyId}/diapers?flagged=true&appointmentId=${scope}`;

  const { data: notes } = useSWR<DoctorNoteItem[]>(notesKey, fetcher);
  const { data: flaggedPhotos } = useSWR<Photo[]>(photosKey, fetcher);
  const { data: flaggedDiapers } = useSWR<DiaperLogItem[]>(diapersKey, fetcher);

  const [questionText, setQuestionText] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);

  const unansweredCount = notes?.filter((n) => !n.answered).length ?? 0;
  const sortedNotes = [...(notes ?? [])].sort((a, b) => Number(a.answered) - Number(b.answered));

  async function handleAddQuestion() {
    if (!questionText.trim()) return;
    setAddingQuestion(true);
    const res = await apiFetch(`/babies/${babyId}/doctor-notes`, {
      method: "POST",
      body: JSON.stringify({ question: questionText, appointmentId }),
    });
    setAddingQuestion(false);
    if (!res.ok) {
      toast("Failed to add question", "error");
      return;
    }
    await mutate(notesKey);
    setQuestionText("");
  }

  async function handleToggleAnswered(note: DoctorNoteItem) {
    const res = await apiFetch(`/babies/${babyId}/doctor-notes/${note.id}`, {
      method: "PATCH",
      body: JSON.stringify({ answered: !note.answered }),
    });
    if (res.ok) await mutate(notesKey);
    else toast("Failed to update", "error");
  }

  async function handleDeleteQuestion(id: string) {
    const res = await apiFetch(`/babies/${babyId}/doctor-notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(notesKey);
      toast("Question removed", "success");
    } else {
      toast("Failed to delete", "error");
    }
  }

  async function handleUnflagPhoto(photoId: string) {
    if (!appointmentId) return;
    const res = await apiFetch(`/babies/${babyId}/photos/${photoId}/appointments/${appointmentId}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(photosKey);
      toast("Unflagged", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  async function handleUnflagDiaper(logId: string) {
    if (!appointmentId) return;
    const res = await apiFetch(`/babies/${babyId}/diapers/${logId}/appointments/${appointmentId}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(diapersKey);
      toast("Unflagged", "success");
    } else {
      toast("Failed to update", "error");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: colors.foreground + "66" }]}>
        Questions for the doctor{unansweredCount > 0 ? ` (${unansweredCount})` : ""}
      </Text>
      <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>
        <View style={styles.addQuestionRow}>
          <Input value={questionText} onChangeText={setQuestionText} placeholder="e.g. Is this rash normal?" style={styles.flex1} />
          <Button size="sm" loading={addingQuestion} onPress={handleAddQuestion}>
            Add
          </Button>
        </View>
        {sortedNotes.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.foreground + "66" }]}>
            No questions yet. Jot one down whenever it comes to mind, and ask it at this visit.
          </Text>
        ) : (
          <View style={styles.questionList}>
            {sortedNotes.map((note) => (
              <View key={note.id} style={styles.questionRow}>
                <Pressable
                  onPress={() => handleToggleAnswered(note)}
                  style={[
                    styles.checkCircle,
                    {
                      borderColor: note.answered ? colors.pink[500] : colors.pink[200],
                      backgroundColor: note.answered ? colors.pink[500] : "transparent",
                    },
                  ]}
                >
                  {note.answered && <CheckIcon size={11} strokeWidth={2.5} />}
                </Pressable>
                <Text
                  style={[
                    styles.questionText,
                    { color: note.answered ? colors.foreground + "66" : colors.foreground },
                    note.answered && styles.strikethrough,
                  ]}
                >
                  {note.question}
                </Text>
                <Pressable onPress={() => handleDeleteQuestion(note.id)} hitSlop={8}>
                  <TrashIcon size={14} color={colors.foreground + "33"} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionLabel, { color: colors.foreground + "66" }]}>Flagged photos</Text>
        <Pressable onPress={() => router.push(`/(app)/babies/${babyId}/photos` as never)}>
          <Text style={[styles.linkText, { color: colors.foreground + "66" }]}>Manage photos</Text>
        </Pressable>
      </View>
      {flaggedPhotos?.length ? (
        <View style={styles.photoGrid}>
          {flaggedPhotos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => handleUnflagPhoto(photo.id)}
              style={[styles.photoCell, { backgroundColor: colors.pink[50], borderColor: colors.pink[100] + "99" }]}
            >
              <Image source={{ uri: filesUrl(photo.path), headers: authHeaders }} style={styles.photoImage} contentFit="cover" />
              <View style={[styles.unflagBadge, { backgroundColor: colors.pink[500] }]}>
                <FlagIcon size={12} filled color="#fff" />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>
          <Text style={[styles.emptyText, { color: colors.foreground + "66" }]}>
            No photos flagged yet. Tap the flag on any photo to add it here.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionLabel, { color: colors.foreground + "66" }]}>Flagged diaper notes</Text>
        <Pressable onPress={() => router.push({ pathname: `/(app)/babies/${babyId}/feeding` as never, params: { tab: "diaper" } })}>
          <Text style={[styles.linkText, { color: colors.foreground + "66" }]}>View diaper log</Text>
        </Pressable>
      </View>
      {flaggedDiapers?.length ? (
        <View style={styles.list}>
          {flaggedDiapers.map((log) => (
            <View key={log.id} style={[styles.row, { borderColor: colors.pink[100] + "99" }]}>
              <View style={styles.flex1}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{DIAPER_LABELS[log.type] ?? log.type}</Text>
                <Text style={[styles.rowNotes, { color: colors.foreground + "80" }]} numberOfLines={1}>
                  {log.notes ?? "No note"}
                </Text>
              </View>
              <Text style={[styles.rowDate, { color: colors.foreground + "66" }]}>
                {new Date(log.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
              <Pressable onPress={() => handleUnflagDiaper(log.id)} hitSlop={8}>
                <FlagIcon size={16} filled color={colors.pink[500]} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>
          <Text style={[styles.emptyText, { color: colors.foreground + "66" }]}>No flagged diaper notes.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  linkText: { fontSize: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4 },
  addQuestionRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  flex1: { flex: 1 },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 8 },
  questionList: { gap: 4 },
  questionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  questionText: { flex: 1, fontSize: 14 },
  strikethrough: { textDecorationLine: "line-through" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoCell: { width: 90, height: 90, borderRadius: 12, borderWidth: 1, overflow: "hidden", position: "relative" },
  photoImage: { width: "100%", height: "100%" },
  unflagBadge: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  list: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 14 },
  rowTitle: { fontSize: 14, fontWeight: "500" },
  rowNotes: { fontSize: 12, marginTop: 1 },
  rowDate: { fontSize: 12 },
});
