import useSWR from "swr";
import { apiFetch } from "@/lib/api-client";

const fetcher = (url: string) => apiFetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json(); });

export function useVaccinations(babyId: string) {
  return useSWR(babyId ? `/api/babies/${babyId}/vaccinations` : null, fetcher);
}

export function useGrowthRecords(babyId: string, type?: "WEIGHT" | "HEIGHT") {
  const qs = type ? `?type=${type}` : "";
  return useSWR(babyId ? `/api/babies/${babyId}/growth${qs}` : null, fetcher);
}

export function useHealthRecords(babyId: string) {
  return useSWR(babyId ? `/api/babies/${babyId}/health-records` : null, fetcher);
}
