import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useToast } from "@/components/ui/Toast";
import { combineDateTime, dateFromInput, nowDateStr, nowTimeStr, splitDateTime } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeContext";

const FEED_TYPES = [
  { value: "BOTTLE", label: "Bottle" },
  { value: "BREAST_LEFT", label: "Breast (L)" },
  { value: "BREAST_RIGHT", label: "Breast (R)" },
  { value: "SOLID", label: "Solid" },
] as const;

const AMOUNT_UNITS = [
  { value: "ml", label: "ml" },
  { value: "oz", label: "oz" },
] as const;

const DURATION_UNITS = [
  { value: "min", label: "min" },
  { value: "hr", label: "hr" },
] as const;

export interface FeedingLog {
  id: string;
  type: string;
  amount?: number | null;
  duration?: number | null;
  unit?: string | null;
  notes?: string | null;
  loggedAt: string;
}

interface FeedingFormModalProps {
  open: boolean;
  onClose: () => void;
  babyId: string;
  editingLog?: FeedingLog | null;
  onSaved: () => void;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

export function FeedingFormModal({ open, onClose, babyId, editingLog, onSaved, apiFetch }: FeedingFormModalProps) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const [type, setType] = useState<(typeof FEED_TYPES)[number]["value"]>("BOTTLE");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [amountUnit, setAmountUnit] = useState<(typeof AMOUNT_UNITS)[number]["value"]>("ml");
  const [durationUnit, setDurationUnit] = useState<(typeof DURATION_UNITS)[number]["value"]>("min");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(nowDateStr());
  const [time, setTime] = useState(nowTimeStr());
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingLog) {
      setType(editingLog.type as (typeof FEED_TYPES)[number]["value"]);
      setAmount(editingLog.amount != null ? String(editingLog.amount) : "");
      setDuration(editingLog.duration != null ? String(editingLog.duration) : "");
      if (editingLog.unit === "oz" || editingLog.unit === "ml") setAmountUnit(editingLog.unit);
      if (editingLog.unit === "hr" || editingLog.unit === "min") setDurationUnit(editingLog.unit);
      setNotes(editingLog.notes ?? "");
      const split = splitDateTime(editingLog.loggedAt);
      setDate(split.date);
      setTime(split.time);
    } else {
      setType("BOTTLE");
      setAmount("");
      setDuration("");
      setNotes("");
      setDate(nowDateStr());
      setTime(nowTimeStr());
    }
  }, [open, editingLog]);

  const showAmount = type === "BOTTLE" || type === "SOLID";
  const showDuration = type === "BREAST_LEFT" || type === "BREAST_RIGHT";

  async function handleSubmit() {
    setLoading(true);
    const body: Record<string, unknown> = { type, amount: null, duration: null, unit: null };
    if (showAmount && amount) {
      body.amount = parseFloat(amount);
      body.unit = amountUnit;
    }
    if (showDuration && duration) {
      body.duration = parseFloat(duration);
      body.unit = durationUnit;
    }
    body.notes = notes || null;
    body.loggedAt = combineDateTime(date, time);

    const path = editingLog ? `/babies/${babyId}/feeding/${editingLog.id}` : `/babies/${babyId}/feeding`;
    const res = await apiFetch(path, { method: editingLog ? "PATCH" : "POST", body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) {
      toast("Failed to log", "error");
      return;
    }
    toast(editingLog ? "Feeding updated!" : "Feeding logged!", "success");
    onClose();
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={editingLog ? "Edit feeding" : "Log a feeding"}>
      <View style={styles.form}>
        <View>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Type</Text>
          <SegmentedToggle options={[...FEED_TYPES]} value={type} onChange={setType} />
        </View>

        {showAmount && (
          <View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Amount</Text>
            <View style={styles.row}>
              <Input
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="e.g. 120"
                style={styles.flex1}
              />
              <View style={styles.flex1}>
                <SegmentedToggle options={[...AMOUNT_UNITS]} value={amountUnit} onChange={setAmountUnit} />
              </View>
            </View>
          </View>
        )}

        {showDuration && (
          <View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Duration</Text>
            <View style={styles.row}>
              <Input
                value={duration}
                onChangeText={setDuration}
                keyboardType="decimal-pad"
                placeholder="e.g. 15"
                style={styles.flex1}
              />
              <View style={styles.flex1}>
                <SegmentedToggle options={[...DURATION_UNITS]} value={durationUnit} onChange={setDurationUnit} />
              </View>
            </View>
          </View>
        )}

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
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={dateFromInput(date)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              themeVariant="light"
              onChange={(event, d) => {
                setShowDatePicker(Platform.OS === "ios");
                if (event.type === "set" && d) {
                  setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
                }
              }}
            />
          </View>
        )}
        {showTimePicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={new Date(`2000-01-01T${time}`)}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant="light"
              onChange={(event, d) => {
                setShowTimePicker(Platform.OS === "ios");
                if (event.type === "set" && d) {
                  setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
                }
              }}
            />
          </View>
        )}

        <View>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            Note <Text style={{ color: colors.foreground + "66", fontWeight: "400" }}>(optional)</Text>
          </Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it go?"
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
        </View>

        <Button loading={loading} onPress={handleSubmit} style={styles.submit}>
          Save feeding
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, marginTop: 8 },
  pickerWrap: { alignItems: "center" },
  fieldLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  flex1: { flex: 1 },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  submit: { width: "100%" },
});
