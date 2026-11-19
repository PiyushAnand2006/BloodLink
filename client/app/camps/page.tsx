"use client";

import { useState } from "react";
import { useCamps } from "@/hooks/useApiData";
import { useMe } from "@/hooks/useMe";
import { bloodGroupLabel } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TimeAgo } from "@/components/ui/TimeBits";
import { SearchIcon } from "@/components/ui/icons";
import { CalendarIcon, MapPinIcon, ClockIcon } from "@/components/ui/icons";

export default function CampsPage() {
  const [city, setCity] = useState("");
  const { data } = useCamps({ city });
  const { user } = useMe();

  const today = new Date().setHours(0, 0, 0, 0);
  const camps = data?.camps ?? [];
  const upcoming = camps.filter((c) => new Date(c.date).getTime() >= today);
  const past = camps.filter((c) => new Date(c.date).getTime() < today);

  return (
    <div className="py-2">
      <PageHeader
        title="Donation camps"
        subtitle="Blood donation camps organised by NGOs across cities."
        actions={
          user?.role === "NGO" ? (
            <a href="/org/camps" className="text-sm font-semibold text-primary hover:underline">
              Manage my camps →
            </a>
          ) : undefined
        }
      />

      <div className="mb-5 flex items-end gap-3 rounded-lg border border-line bg-surface p-4 shadow-card">
        <div className="w-56">
          <label htmlFor="camps-city" className="mb-1 block text-xs font-semibold text-navy">
            City
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <input
              id="camps-city"
              className="w-full rounded border border-line bg-white px-3 py-2 pl-8 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder="All cities"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>
        <TimeAgo iso={camps[0]?.date ?? null} prefix="Checked" />
      </div>

      {camps.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon />}
          title="No camps found"
          hint="NGOs post upcoming donation camps here — check back soon or try another city."
        />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="upcoming-camps">
            <h2 id="upcoming-camps" className="mb-3 text-base font-semibold text-navy">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">No upcoming camps in this city yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((camp) => (
                  <CampCard key={camp.id} camp={camp} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section aria-labelledby="past-camps">
              <h2 id="past-camps" className="mb-3 text-base font-semibold text-muted">
                Past camps
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {past.map((camp) => (
                  <CampCard key={camp.id} camp={camp} past />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CampCard({ camp, past = false }: { camp: NonNullable<ReturnType<typeof useCamps>["data"]>["camps"][number]; past?: boolean }) {
  return (
    <div
      className={`rounded-lg border bg-surface p-4 shadow-card ${past ? "border-line opacity-70" : "border-line"}`}
    >
      <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-info">
        <CalendarIcon className="h-3.5 w-3.5" />
        {fmtDate(camp.date)} · {camp.startTime}–{camp.endTime}
      </p>
      <p className="mt-1.5 font-semibold text-navy">{camp.title}</p>
      <p className="mt-1 flex items-start gap-1 text-xs text-muted">
        <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {camp.venue}, {camp.city} — {camp.pincode}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
        <ClockIcon className="h-3.5 w-3.5" />
        Walk-ins {camp.startTime} onwards
      </p>
      {camp.description && <p className="mt-2 text-xs leading-relaxed text-muted">{camp.description}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {camp.bloodGroupsNeeded.map((g) => (
          <span key={g} className="rounded bg-primary-50 px-1.5 py-0.5 text-2xs font-bold text-primary">
            {bloodGroupLabel(g)}
          </span>
        ))}
      </div>
      {camp.org?.orgProfile?.orgName && (
        <p className="mt-2 text-2xs text-muted">Organised by {camp.org.orgProfile.orgName}</p>
      )}
    </div>
  );
}
