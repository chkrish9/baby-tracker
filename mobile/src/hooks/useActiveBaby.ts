import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSegments } from "expo-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "activeBabyId";

// Mirrors web/src/components/layout/BottomNav.tsx's activeBabyId tracking:
// when on a specific baby's route, persist+use that id; elsewhere (dashboard,
// settings), fall back to the last-persisted one.
export function useActiveBaby(): string | null {
  const segments = useSegments() as string[];
  const [storedId, setStoredId] = useState<string | null>(null);

  const babiesIdx = segments.indexOf("babies");
  const next = babiesIdx !== -1 ? segments[babiesIdx + 1] : undefined;
  const babyId = next && next !== "new" ? next : undefined;

  useEffect(() => {
    if (babyId) {
      AsyncStorage.setItem(STORAGE_KEY, babyId).catch(() => {});
      setStoredId(babyId);
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then(setStoredId).catch(() => {});
    }
  }, [babyId]);

  return babyId ?? storedId;
}
