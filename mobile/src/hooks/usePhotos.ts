import useSWR from "swr";
import { apiFetch } from "@/lib/apiClient";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

export interface Photo {
  id: string;
  path: string;
  filename: string;
  size: number;
  caption?: string | null;
  appointmentIds: string[];
  takenAt: string;
}

export function usePhotos(babyId: string | undefined) {
  return useSWR<Photo[]>(babyId ? `/babies/${babyId}/photos` : null, fetcher);
}
