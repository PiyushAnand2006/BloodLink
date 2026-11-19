"use client";

import Link from "next/link";
import { bloodGroupLabel, type ApiCamp } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { CalendarIcon, MapPinIcon } from "@/components/ui/icons";

/** Upcoming donation camps strip (dashboard + landing). */
export function CampsStrip({ camps }: { camps: ApiCamp[] }) {
  const upcoming = camps
    .filter((c) => new Date(c.date).getTime() >= new Date().setHours(0, 0, 0, 0))
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <section aria-labelledby="camps-strip">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="camps-strip" className="text-base font-semibold text-navy">
          Upcoming donation camps
        </h2>
        <Link href="/camps" className="text-xs font-semibold text-info hover:underline">
          All camps →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((camp) => (
          <div key={camp.id} className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-info">
              <CalendarIcon className="h-3.5 w-3.5" />
              {fmtDate(camp.date)} · {camp.startTime}–{camp.endTime}
            </p>
            <p className="mt-1.5 font-semibold text-navy">{camp.title}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {camp.venue}, {camp.city}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {camp.bloodGroupsNeeded.map((g) => (
                <span
                  key={g}
                  className="rounded bg-primary-50 px-1.5 py-0.5 text-2xs font-bold text-primary"
                >
                  {bloodGroupLabel(g)}
                </span>
              ))}
            </div>
            {camp.org?.orgProfile?.orgName && (
              <p className="mt-2 text-2xs text-muted">by {camp.org.orgProfile.orgName}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
