import useSWR from "swr";
import { apiFetch } from "@/lib/apiClient";
import { Baby } from "@/types/baby";

const fetcher = (url: string) =>
  apiFetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch failed");
    return r.json();
  });

export function useBabies() {
  return useSWR<Baby[]>("/babies", fetcher);
}

export function useBaby(babyId: string | undefined) {
  return useSWR<Baby | undefined>(babyId ? `/babies/${babyId}` : null, fetcher);
}
