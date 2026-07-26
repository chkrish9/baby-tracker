import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import useSWR from "swr";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useTheme } from "@/theme/ThemeContext";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

interface Appointment {
  id: string;
  date: string;
  notes?: string | null;
}

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

interface FlagAppointmentsModalProps {
  open: boolean;
  onClose: () => void;
  babyId: string;
  currentAppointmentIds: string[];
  onSave: (appointmentIds: string[]) => Promise<void>;
}

export function FlagAppointmentsModal({ open, onClose, babyId, currentAppointmentIds, onSave }: FlagAppointmentsModalProps) {
  const { colors } = useTheme();
  const { data: appointments } = useSWR<Appointment[]>(open ? `/babies/${babyId}/appointments` : null, fetcher);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const currentIdsKey = currentAppointmentIds.join(",");
  useEffect(() => {
    if (open) setSelected(new Set(currentIdsKey ? currentIdsKey.split(",") : []));
  }, [open, currentIdsKey]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await onSave(Array.from(selected));
    setSaving(false);
    onClose();
  }

  const sorted = [...(appointments ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Modal open={open} onClose={onClose} title="Flag for appointment(s)">
      <View style={styles.container}>
        {appointments && sorted.length === 0 ? (
          <Text style={[styles.empty, { color: colors.foreground + "80" }]}>
            No appointments yet. Add one from the Doctor Visit page to flag items for it.
          </Text>
        ) : (
          <ScrollView style={styles.list}>
            {sorted.map((appt) => {
              const checked = selected.has(appt.id);
              return (
                <Pressable
                  key={appt.id}
                  onPress={() => toggle(appt.id)}
                  style={[styles.row, { backgroundColor: colors.pink[50] + "80" }]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: checked ? colors.pink[500] : colors.pink[200], backgroundColor: checked ? colors.pink[500] : "transparent" },
                    ]}
                  >
                    {checked && <CheckIcon size={12} strokeWidth={3} />}
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.apptDate, { color: colors.foreground }]}>{formatApptDate(appt.date)}</Text>
                    {appt.notes && (
                      <Text style={[styles.apptNotes, { color: colors.foreground + "80" }]} numberOfLines={1}>
                        {appt.notes}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <Button onPress={handleSave} loading={saving} style={styles.saveButton}>
          {selected.size === 0 ? "Unflag" : `Save (${selected.size} selected)`}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  empty: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
  list: { maxHeight: 288, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12, marginBottom: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1, minWidth: 0 },
  apptDate: { fontSize: 14, fontWeight: "500" },
  apptNotes: { fontSize: 12, marginTop: 1 },
  saveButton: { width: "100%", marginTop: 16 },
});
