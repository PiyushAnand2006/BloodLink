"use client";

import { StarIcon } from "@/components/ui/icons";

/** Banner: number of available rare (negative group) donors. */
export function RareBanner({ count, city }: { count: number | undefined; city: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-[#E8F1FC] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
        <StarIcon className="h-5 w-5" />
      </span>
      <p className="text-sm text-navy">
        <span className="font-bold">{count ?? "…"}</span> rare blood group donors
        <span className="text-muted"> (AB−, B−, O−, A−) </span>
        currently available & eligible
        {city ? <> in <span className="font-semibold">{city}</span></> : " across all cities"}
      </p>
    </div>
  );
}
