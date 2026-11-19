"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api";

/**
 * Global SWR defaults: every key polls every 20 seconds (the realtime
 * strategy of this app), with no infinite retries.
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        refreshInterval: 20000,
        shouldRetryOnError: false,
        revalidateOnFocus: true,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
