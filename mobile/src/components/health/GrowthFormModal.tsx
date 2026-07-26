import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { nowDateStr } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeContext";

export type GrowthType = "WEIGHT" | "HEIGHT";

export interface GrowthRecord {
  id: string;
  type: GrowthType;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string | null;
}

const WEIGHT_UNITS = [
  { value: "kg", label: "kg" },
  { value: "lb", label: "lb" },
] as const;
const HEIGHT_UNITS = [
  { value: "cm", label: "cm" },
  { value: "in", label: "in" },
] as const;

interface GrowthFormModalProps {
  open: boolean;
  onClose: () => void;
  growthType: GrowthType;
  editing?: GrowthRecord | null;
  onSubmit: (values: { value: string; unit: string; date: string; notes: string }) => Promise<void>;
  saving: boolean;
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function GrowthFormModal({ open, onClose, growthType, editing, onSubmit, saving }: GrowthFormModalProps) {
  const { colors } = useTheme();
  const unitOptions = growthType === "HEIGHT" ? HEIGHT_UNITS : WEIGHT_UNITS;
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<string>(unitOptions[0].value);
  const [date, setDate] = useState(nowDateStr());
  const [notes, setNotes] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setValue(String(editing.value));
      setUnit(editing.unit);
      setDate(toDateInputValue(editing.recordedAt));
      setNotes(editing.notes ?? "");
    } else {
      setValue("");
      setUnit(growthType === "HEIGHT" ? "cm" : "kg");
      setDate(nowDateStr());
      setNotes("");
    }
  }, [open, editing, growthType]);

  const label = growthType === "HEIGHT" ? "height" : "weight";
  const numericValue = parseFloat(value);
  const canSubmit = Number.isFinite(numericValue) && numericValue > 0 && !!date;

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${label}` : `Log ${label}`}>
      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Label>Value</Label>
            <Input value={value} onChangeText={setValue} keyboardType="decimal-pad" />
          </View>
          <View style={styles.unitCol}>
            <Label>Unit</Label>
            <SegmentedToggle options={[...unitOptions]} value={unit} onChange={setUnit} />
          </View>
        </View>
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
            Notes <Text style={[styles.optional, { color: colors.foreground + "66" }]}>(optional)</Text>
          </Label>
          <Input value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={styles.textarea} />
        </View>
        <Button
          loading={saving}
          disabled={!canSubmit}
          onPress={() => onSubmit({ value, unit, date, notes })}
          style={styles.submit}
        >
          {editing ? "Update" : "Save"}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, marginTop: 8 },
  row: { flexDirection: "row", gap: 8 },
  flex1: { flex: 1 },
  unitCol: { width: 110 },
  optional: { fontWeight: "400" },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  submit: { width: "100%" },
});
