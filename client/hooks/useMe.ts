"use client";

import useSWR from "swr";
import { ApiError, fetcher } from "@/lib/api";
import type { ApiMeResponse, ApiUser } from "@/lib/constants";

export interface MeState {
  /** undefined = still loading, null = logged out, else the user. */
  user: ApiUser | null | undefined;
  isLoading: boolean;
  /** True while a (re)validation is in flight — stale cache may still be shown. */
  isValidating: boolean;
  unauthorized: boolean;
  /** Revalidates /auth/me and resolves when the session state is fresh. */
  refresh: () => Promise<unknown>;
}

export function useMe(): MeState {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiMeResponse>("/auth/me", fetcher, {
    shouldRetryOnError: false,
  });
  const unauthorized = error instanceof ApiError && error.status === 401;
  const user = unauthorized ? null : (data?.user ?? undefined);
  return {
    user,
    isLoading: isLoading && !unauthorized,
    isValidating,
    unauthorized,
    refresh: () => mutate(),
  };
}
