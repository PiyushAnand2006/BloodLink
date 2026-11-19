"use client";

import { useState } from "react";
import Link from "next/link";
import { useRequests } from "@/hooks/useApiData";
import { useMe } from "@/hooks/useMe";
import { BLOOD_GROUPS, COMPONENTS, REQUEST_STATUSES, URGENCIES } from "@/lib/constants";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TimeAgo } from "@/components/ui/TimeBits";
import { Select } from "@/components/ui/forms";
import { DropIcon, SearchIcon } from "@/components/ui/icons";

export default function RequestsPage() {
  const [filters, setFilters] = useState({
    bloodGroup: "",
    component: "",
    city: "",
    urgency: "",
    status: "OPEN",
  });
  const { user } = useMe();
  const { data } = useRequests(filters);

  const set = (key: keyof typeof filters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="py-2">
      <PageHeader
        title="Emergency blood requests"
        subtitle="Every open request from hospitals — pledge if you can donate."
        actions={
          user?.role === "HOSPITAL" ? (
            <Link href="/hospital/requests/new" className="text-sm font-semibold text-primary hover:underline">
              + New request
            </Link>
          ) : undefined
        }
      />

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4 shadow-card">
        <FilterSelect label="Blood group" value={filters.bloodGroup} onChange={set("bloodGroup")}>
          <option value="">All groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Component" value={filters.component} onChange={set("component")}>
          <option value="">All components</option>
          {COMPONENTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Urgency" value={filters.urgency} onChange={set("urgency")}>
          <option value="">Any urgency</option>
          {URGENCIES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Status" value={filters.status} onChange={set("status")}>
          {REQUEST_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </FilterSelect>
        <div className="w-44">
          <label htmlFor="f-city" className="mb-1 block text-xs font-semibold text-navy">
            City
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <input
              id="f-city"
              className="w-full rounded border border-line bg-white px-3 py-2 pl-8 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              placeholder="All cities"
              value={filters.city}
              onChange={(e) => set("city")(e.target.value)}
            />
          </div>
        </div>
      </div>

      {data && data.requests.length === 0 ? (
        <EmptyState
          icon={<DropIcon />}
          title="No requests match these filters"
          hint="Try widening the filters — lives depend on visibility."
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-end">
            <TimeAgo iso={data?.requests?.[0]?.createdAt ?? null} prefix="Checked" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {data?.requests.map((r) => (
              <RequestCard key={r.id} request={r} showStatus={filters.status !== "OPEN"} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="w-40">
      <label className="mb-1 block text-xs font-semibold text-navy">{label}</label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Select>
    </div>
  );
}
