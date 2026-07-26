import useSWR from "swr";
import { apiFetch } from "@/lib/apiClient";

const fetcher = (url: string) =>
  apiFetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch failed");
    return r.json();
  });

export function useFeedings(babyId: string | undefined) {
  return useSWR(babyId ? `/babies/${babyId}/feeding` : null, fetcher);
}
