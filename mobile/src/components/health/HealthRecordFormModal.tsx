import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { dateFromInput, nowDateStr } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeContext";

export interface HealthRecordItem {
  id: string;
  title: string;
  date: string;
  notes?: string | null;
}

interface HealthRecordFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: HealthRecordItem | null;
  onSubmit: (values: { title: string; date: string; notes: string }) => Promise<void>;
  saving: boolean;
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function HealthRecordFormModal({ open, onClose, editing, onSubmit, saving }: HealthRecordFormModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(nowDateStr());
  const [notes, setNotes] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDate(toDateInputValue(editing.date));
      setNotes(editing.notes ?? "");
    } else {
      setTitle("");
      setDate(nowDateStr());
      setNotes("");
    }
  }, [open, editing]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit record" : "Add health record"}>
      <View style={styles.form}>
        <View>
          <Label>Title</Label>
          <Input value={title} onChangeText={setTitle} placeholder="e.g. Allergy diagnosis" />
        </View>
        <View>
          <Label>Date</Label>
          <Pressable onPress={() => setShowPicker(true)}>
            <View pointerEvents="none">
              <Input value={date} editable={false} />
            </View>
          </Pressable>
          {showPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={dateFromInput(date)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                themeVariant="light"
                onChange={(event, d) => {
                  setShowPicker(Platform.OS === "ios");
                  if (event.type === "set" && d) {
                    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
                  }
                }}
              />
            </View>
          )}
        </View>
        <View>
          <Label>
            Notes <Text style={[styles.optional, { color: colors.foreground + "66" }]}>(optional)</Text>
          </Label>
          <Input value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={styles.textarea} />
        </View>
        <Button
          loading={saving}
          disabled={!title.trim() || !date}
          onPress={() => onSubmit({ title: title.trim(), date, notes })}
          style={styles.submit}
        >
          {editing ? "Update record" : "Save record"}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, marginTop: 8 },
  pickerWrap: { alignItems: "center" },
  optional: { fontWeight: "400" },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  submit: { width: "100%" },
});
