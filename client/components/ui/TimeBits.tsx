"use client";

import { useNow } from "@/hooks/useNow";
import { countdown, fmtTimeAgo } from "@/lib/format";
import { AlertTriangleIcon, ClockIcon } from "./icons";

/** "Updated Xs ago" — auto-refresh indicator. */
export function TimeAgo({ iso, prefix = "Updated" }: { iso: string | null; prefix?: string }) {
  const now = useNow(1000);
  if (!iso || now === null) return <span className="text-2xs text-muted">…</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs text-muted">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      {prefix} {fmtTimeAgo(iso, now)}
    </span>
  );
}

/** Ticking countdown to a deadline ("in 5h 12m" / "Overdue"). */
export function Countdown({ neededBy }: { neededBy: string }) {
  const now = useNow(30000);
  if (now === null) return <span className="text-2xs text-muted">…</span>;
  const info = countdown(neededBy, now);
  if (info.expired) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs font-semibold text-danger">
        <AlertTriangleIcon className="h-3.5 w-3.5" />
        Overdue
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-2xs font-semibold ${
        info.criticalSoon ? "text-[#8a6d00]" : "text-muted"
      }`}
    >
      <ClockIcon className="h-3.5 w-3.5" />
      Needed {info.text}
    </span>
  );
}
