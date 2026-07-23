import useSWR from "swr";
import { apiFetch } from "@/lib/api-client";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  theme: string;
  profilePhoto: string | null;
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<CurrentUser>("/api/user/settings", fetcher, {
    shouldRetryOnError: false,
  });

  return {
    user: data,
    isLoggedOut: error !== undefined,
    isLoading,
    mutate,
  };
}
