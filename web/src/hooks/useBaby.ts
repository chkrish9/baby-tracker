import useSWR from "swr";
import { apiFetch } from "@/lib/api-client";

const fetcher = (url: string) => apiFetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json(); });

export function useBabies() {
  return useSWR("/api/babies", fetcher);
}

export function useBaby(babyId: string) {
  return useSWR(babyId ? `/api/babies/${babyId}` : null, fetcher);
}
