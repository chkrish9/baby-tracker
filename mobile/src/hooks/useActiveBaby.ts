import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "activeBabyId";

// Mirrors web/src/components/layout/BottomNav.tsx's activeBabyId tracking:
// when on a specific baby's route, persist+use that id; elsewhere (dashboard,
// settings), fall back to the last-persisted one.
//
// Must parse usePathname() (resolved URL), not useSegments() — segments for a
// dynamic route return the literal file-path placeholder (e.g. "[babyId]"),
// not the matched value, which silently broke every section-permission check
// downstream of this hook.
export function useActiveBaby(): string | null {
  const pathname = usePathname();
  const [storedId, setStoredId] = useState<string | null>(null);

  const match = pathname.match(/^\/babies\/([^/]+)/);
  const babyId = match && match[1] !== "new" ? match[1] : undefined;

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
