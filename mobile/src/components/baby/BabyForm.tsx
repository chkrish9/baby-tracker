import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useTheme } from "@/theme/ThemeContext";

export interface BabyFormValues {
  firstName: string;
  lastName: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD
  weight: string;
  height: string;
}

interface BabyFormProps {
  initialValues?: Partial<BabyFormValues>;
  onSubmit: (values: BabyFormValues) => void;
  submitLabel: string;
  loading?: boolean;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function BabyForm({ initialValues, onSubmit, submitLabel, loading }: BabyFormProps) {
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [nickname, setNickname] = useState(initialValues?.nickname ?? "");
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate ?? "");
  const [weight, setWeight] = useState(initialValues?.weight ?? "");
  const [height, setHeight] = useState(initialValues?.height ?? "");
  const [showPicker, setShowPicker] = useState(false);

  const canSubmit = firstName.trim() && lastName.trim() && birthDate;

  return (
    <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Label>First name</Label>
          <Input value={firstName} onChangeText={setFirstName} placeholder="e.g. Emma" />
        </View>
        <View style={styles.flex1}>
          <Label>Last name</Label>
          <Input value={lastName} onChangeText={setLastName} placeholder="e.g. Smith" />
        </View>
      </View>

      <View>
        <Label>
          Nickname <Text style={{ color: colors.foreground + "66", fontWeight: "400" }}>(optional)</Text>
        </Label>
        <Input value={nickname} onChangeText={setNickname} placeholder="e.g. Emmy" />
      </View>

      <View>
        <Label>Date of birth</Label>
        <Pressable onPress={() => setShowPicker(true)}>
          <View pointerEvents="none">
            <Input value={birthDate} placeholder="YYYY-MM-DD" editable={false} />
          </View>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={birthDate ? new Date(birthDate) : new Date()}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, date) => {
              setShowPicker(Platform.OS === "ios");
              if (event.type === "set" && date) setBirthDate(toDateInput(date));
            }}
          />
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Label>
            Weight (kg) <Text style={{ color: colors.foreground + "66", fontWeight: "400" }}>(optional)</Text>
          </Label>
          <Input value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="e.g. 3.4" />
        </View>
        <View style={styles.flex1}>
          <Label>
            Height (cm) <Text style={{ color: colors.foreground + "66", fontWeight: "400" }}>(optional)</Text>
          </Label>
          <Input value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="e.g. 50" />
        </View>
      </View>

      <Button
        loading={loading}
        disabled={!canSubmit}
        onPress={() => onSubmit({ firstName, lastName, nickname, birthDate, weight, height })}
        style={styles.submit}
      >
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  submit: {
    width: "100%",
  },
});
