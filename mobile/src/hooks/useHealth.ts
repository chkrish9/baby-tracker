import useSWR from "swr";
import { apiFetch } from "@/lib/apiClient";

const fetcher = (url: string) =>
  apiFetch(url).then((r) => {
    if (!r.ok) throw new Error("Fetch failed");
    return r.json();
  });

export function useVaccinations(babyId: string | undefined) {
  return useSWR(babyId ? `/babies/${babyId}/vaccinations` : null, fetcher);
}

export function useGrowthRecords(babyId: string | undefined, type?: "WEIGHT" | "HEIGHT") {
  const qs = type ? `?type=${type}` : "";
  return useSWR(babyId ? `/babies/${babyId}/growth${qs}` : null, fetcher);
}

export function useHealthRecords(babyId: string | undefined) {
  return useSWR(babyId ? `/babies/${babyId}/health-records` : null, fetcher);
}
