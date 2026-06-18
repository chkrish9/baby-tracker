import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json(); });

export function useFeedings(babyId: string) {
  return useSWR(babyId ? `/api/babies/${babyId}/feeding` : null, fetcher);
}
