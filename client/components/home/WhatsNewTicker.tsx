"use client";

import { useCamps, useDashboard, useRequests } from "@/hooks/useApiData";

/** Scrolling "What's New" announcements strip, built from live data. */
export function WhatsNewTicker() {
  const { data: dash } = useDashboard("", "WHOLE_BLOOD");
  const { data: camps } = useCamps({});
  const { data: feed } = useRequests({});

  const openCount = feed?.requests?.length ?? 0;
  const criticalCount = feed?.requests?.filter((r) => r.urgency === "CRITICAL").length ?? 0;
  const today = new Date().setHours(0, 0, 0, 0);
  const campCount = (camps?.camps ?? []).filter((c) => new Date(c.date).getTime() >= today).length;
  const rare = dash?.rareDonorsAvailable ?? 0;

  const items: string[] = [
    `${openCount} emergency request${openCount === 1 ? "" : "s"} open across cities`,
    `${criticalCount} critical requirement${criticalCount === 1 ? "" : "s"} need donors now`,
    `${campCount} donation camp${campCount === 1 ? "" : "s"} coming up`,
    `${rare} rare blood group donors available and eligible`,
  ];
  if (openCount === 0 && campCount === 0) {
    items.unshift("Welcome to BloodLink — create an account to pledge, post requests or list stock");
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      <span className="flex shrink-0 items-center bg-primary px-4 py-2.5 text-2xs font-bold uppercase tracking-widest text-white">
        What&rsquo;s new
      </span>
      <div className="relative flex-1 overflow-hidden" aria-live="polite">
        <div className="animate-marquee flex w-max items-center gap-12 whitespace-nowrap px-4 py-2.5 text-sm text-navy">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
