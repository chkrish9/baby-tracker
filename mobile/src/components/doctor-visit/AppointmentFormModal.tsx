import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { nowDateStr } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeContext";

export interface Appointment {
  id: string;
  date: string;
  notes?: string | null;
}

interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: Appointment | null;
  onSubmit: (values: { date: string; notes: string }) => Promise<void>;
  saving: boolean;
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AppointmentFormModal({ open, onClose, editing, onSubmit, saving }: AppointmentFormModalProps) {
  const { colors } = useTheme();
  const [date, setDate] = useState(nowDateStr());
  const [notes, setNotes] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDate(toDateInputValue(editing.date));
      setNotes(editing.notes ?? "");
    } else {
      setDate(nowDateStr());
      setNotes("");
    }
  }, [open, editing]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit appointment" : "Add appointment"}>
      <View style={styles.form}>
        <View>
          <Label>Date</Label>
          <Pressable onPress={() => setShowPicker(true)}>
            <View pointerEvents="none">
              <Input value={date} editable={false} />
            </View>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, d) => {
                setShowPicker(Platform.OS === "ios");
                if (event.type === "set" && d) {
                  setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
                }
              }}
            />
          )}
        </View>
        <View>
          <Label>
            Note <Text style={[styles.optional, { color: colors.foreground + "66" }]}>(optional)</Text>
          </Label>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. 4-month checkup, ask about vaccines"
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
        </View>
        <Button loading={saving} disabled={!date} onPress={() => onSubmit({ date, notes })} style={styles.submit}>
          {editing ? "Update appointment" : "Save appointment"}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, marginTop: 8 },
  optional: { fontWeight: "400" },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  submit: { width: "100%" },
});
