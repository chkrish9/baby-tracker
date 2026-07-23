import useSWR from "swr";
import { apiFetch } from "@/lib/api-client";

const fetcher = (url: string) => apiFetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json(); });

export function useDiapers(babyId: string) {
  return useSWR(babyId ? `/api/babies/${babyId}/diapers` : null, fetcher);
}
