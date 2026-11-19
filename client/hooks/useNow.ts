"use client";

import { useEffect, useState } from "react";

/**
 * A ticking clock for countdowns / "Xs ago" labels. Returns null until
 * mounted (avoids SSR/CSR hydration mismatches for time-relative text).
 */
export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
