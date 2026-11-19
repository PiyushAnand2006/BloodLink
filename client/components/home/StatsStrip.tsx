"use client";

import type { ApiDashboardResponse } from "@/lib/constants";
import { BoxIcon, CalendarIcon, HospitalIcon, PersonIcon } from "@/components/ui/icons";

/** Government-portal style live counters. */
export function StatsStrip({
  summary,
  upcomingCamps,
}: {
  summary: ApiDashboardResponse["summary"] | undefined;
  upcomingCamps: number;
}) {
  const sum = (pick: (t: ApiDashboardResponse["summary"][number]) => number) =>
    (summary ?? []).reduce((acc, t) => acc + pick(t), 0);

  const stats = [
    { label: "Donors available", value: sum((t) => t.donorsAvailable), icon: <PersonIcon className="h-5 w-5" /> },
    { label: "Units in stock", value: sum((t) => t.unitsAvailable), icon: <BoxIcon className="h-5 w-5" /> },
    { label: "Open requests", value: sum((t) => t.openRequests), icon: <HospitalIcon className="h-5 w-5" /> },
    { label: "Upcoming camps", value: upcomingCamps, icon: <CalendarIcon className="h-5 w-5" /> },
  ];

  return (
    <section aria-label="Live statistics">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-surface p-4 text-center shadow-card">
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary">
              {s.icon}
            </span>
            <p className="mt-2 text-3xl font-bold tabular-nums text-navy">{s.value}</p>
            <span className="mx-auto mt-1 block h-1 w-10 rounded bg-primary" aria-hidden />
            <p className="mt-1.5 text-2xs font-semibold uppercase tracking-wide text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
