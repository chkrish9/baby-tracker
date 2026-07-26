import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useToast } from "@/components/ui/Toast";
import { combineDateTime, nowDateStr, nowTimeStr, splitDateTime } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeContext";

const DIAPER_TYPES = [
  { value: "WET", label: "Wet" },
  { value: "DIRTY", label: "Dirty" },
  { value: "BOTH", label: "Mixed" },
] as const;

export interface DiaperLog {
  id: string;
  type: string;
  notes?: string | null;
  loggedAt: string;
}

interface DiaperFormModalProps {
  open: boolean;
  onClose: () => void;
  babyId: string;
  editingLog?: DiaperLog | null;
  onSaved: () => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export function DiaperFormModal({ open, onClose, babyId, editingLog, onSaved, apiFetch }: DiaperFormModalProps) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [type, setType] = useState<(typeof DIAPER_TYPES)[number]["value"]>("WET");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(nowDateStr());
  const [time, setTime] = useState(nowTimeStr());
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingLog) {
      setType(editingLog.type as (typeof DIAPER_TYPES)[number]["value"]);
      setNotes(editingLog.notes ?? "");
      const split = splitDateTime(editingLog.loggedAt);
      setDate(split.date);
      setTime(split.time);
    } else {
      setType("WET");
      setNotes("");
      setDate(nowDateStr());
      setTime(nowTimeStr());
    }
  }, [open, editingLog]);

  async function handleSubmit() {
    setLoading(true);
    const body = { type, notes: notes || null, loggedAt: combineDateTime(date, time) };
    const path = editingLog ? `/babies/${babyId}/diapers/${editingLog.id}` : `/babies/${babyId}/diapers`;
    const res = await apiFetch(path, { method: editingLog ? "PATCH" : "POST", body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) {
      toast("Failed to log", "error");
      return;
    }
    toast(editingLog ? "Diaper updated!" : "Diaper logged!", "success");
    onClose();
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={editingLog ? "Edit diaper change" : "Log a diaper change"}>
      <View style={styles.form}>
        <View>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Type</Text>
          <SegmentedToggle options={[...DIAPER_TYPES]} value={type} onChange={setType} />
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Date</Text>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <Input value={date} editable={false} />
              </View>
            </Pressable>
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Time</Text>
            <Pressable onPress={() => setShowTimePicker(true)}>
              <View pointerEvents="none">
                <Input value={time} editable={false} />
              </View>
            </Pressable>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, d) => {
              setShowDatePicker(Platform.OS === "ios");
              if (event.type === "set" && d) {
                setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
              }
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={new Date(`2000-01-01T${time}`)}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, d) => {
              setShowTimePicker(Platform.OS === "ios");
              if (event.type === "set" && d) {
                setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
              }
            }}
          />
        )}

        <View>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Note <Text style={{ color: colors.foreground + "66", fontWeight: "400" }}>(optional)</Text>
          </Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Colour, consistency, anything unusual..."
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
        </View>

        <Button loading={loading} onPress={handleSubmit} style={styles.submit}>
          Save diaper
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, marginTop: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  flex1: { flex: 1 },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  submit: { width: "100%" },
});
