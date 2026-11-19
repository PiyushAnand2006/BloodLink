"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAvailability,
  useDistricts,
} from "@/hooks/useApiData";
import {
  BLOOD_GROUPS,
  COMPONENTS,
  bloodGroupLabel,
  componentLabel,
  type ApiAvailabilityResult,
} from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TimeAgo } from "@/components/ui/TimeBits";
import { Field, Input, Select } from "@/components/ui/forms";
import { InfoIcon, SearchIcon, ShieldCheckIcon } from "@/components/ui/icons";

const roleLabels: Record<string, string> = {
  DONOR: "Donor",
  NGO: "NGO",
  BLOOD_BANK: "Blood bank",
  HOSPITAL: "Hospital",
  ADMIN: "Admin",
};

/**
 * District-wise blood stock search — the e-RaktKosh-style experience:
 * pick a district, blood group and component; matching inventory is
 * filtered in the database and listed per institution with its last-updated
 * timestamp. Registered inventory is not a real-time guarantee.
 */
export default function AvailabilityPage() {
  const { data: districtsData } = useDistricts();
  const [filters, setFilters] = useState({ districtId: "", bloodGroup: "", component: "" });
  const { data, isLoading } = useAvailability(filters);

  const districts = districtsData?.districts ?? [];

  return (
    <div className="py-2">
      <PageHeader
        title="Blood availability search"
        subtitle="Search registered stock by district, blood group and component — Karnataka."
        actions={<TimeAgo iso={data?.results?.[0]?.updatedAt ?? null} prefix="Checked" />}
      />

      {/* Filters */}
      <div className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-card sm:grid-cols-4">
        <Field label="District" htmlFor="av-district" hint="Karnataka's 31 districts">
          <Select
            id="av-district"
            value={filters.districtId}
            onChange={(e) => setFilters((f) => ({ ...f, districtId: e.target.value }))}
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Blood group" htmlFor="av-group">
          <Select
            id="av-group"
            value={filters.bloodGroup}
            onChange={(e) => setFilters((f) => ({ ...f, bloodGroup: e.target.value }))}
          >
            <option value="">All groups</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Component" htmlFor="av-component">
          <Select
            id="av-component"
            value={filters.component}
            onChange={(e) => setFilters((f) => ({ ...f, component: e.target.value }))}
          >
            <option value="">All components</option>
            {COMPONENTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-muted">
            <SearchIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {isLoading
              ? "Searching…"
              : `${data?.total ?? 0} matching stock record${data?.total === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {/* Inventory disclaimer */}
      <p className="mb-4 flex items-start gap-2 rounded border border-info/30 bg-[#E8F1FC] px-3 py-2 text-xs text-navy">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        {data?.note ??
          "Availability is as last reported by the institution. Confirm with the blood bank before transfusion decisions."}
      </p>

      {isLoading && !data ? (
        <PageSpinner />
      ) : (data?.results ?? []).length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No matching stock records"
          hint="Registered hospitals, blood banks and NGOs have no inventory rows for this combination yet. Try widening the filters."
          action={
            <Link href="/dashboard" className="text-sm font-semibold text-info hover:underline">
              Open the live dashboard →
            </Link>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle text-left text-2xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Institution</th>
                <th className="px-4 py-3 font-semibold">District</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Group</th>
                <th className="px-4 py-3 font-semibold">Component</th>
                <th className="px-4 py-3 font-semibold">Units</th>
                <th className="px-4 py-3 font-semibold">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data!.results.map((r) => (
                <AvailabilityRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function AvailabilityRow({ row }: { row: ApiAvailabilityResult }) {
  return (
    <tr className="align-top hover:bg-subtle/50">
      <td className="px-4 py-3">
        <p className="font-semibold text-navy">{row.orgName}</p>
        <p className="mt-0.5 flex items-center gap-1 text-2xs text-muted">
          {roleLabels[row.orgRole] ?? row.orgRole}
          {row.isVerified && (
            <>
              {" · "}
              <ShieldCheckIcon className="h-3 w-3 text-success" aria-label="Verified" />
              verified
            </>
          )}
        </p>
        {row.contactPerson && <p className="text-2xs text-muted">Contact: {row.contactPerson}</p>}
      </td>
      <td className="px-4 py-3">
        {row.district ? (
          <span className="font-semibold text-navy">{row.district}</span>
        ) : (
          <span className="text-xs italic text-muted">Unknown</span>
        )}
        {row.districtState && <p className="text-2xs text-muted">{row.districtState}</p>}
      </td>
      <td className="max-w-[220px] px-4 py-3 text-xs text-muted">{row.address ?? "—"}</td>
      <td className="px-4 py-3">
        <span className="rounded bg-primary-50 px-2 py-0.5 font-bold text-primary">
          {bloodGroupLabel(row.bloodGroup)}
        </span>
      </td>
      <td className="px-4 py-3 text-muted">{componentLabel(row.component)}</td>
      <td className="px-4 py-3">
        <span className={`font-bold tabular-nums ${row.units === 0 ? "text-danger" : "text-navy"}`}>
          {row.units}
        </span>
        {row.units === 0 && (
          <p className="text-2xs font-semibold uppercase text-danger">None</p>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-muted">{fmtDateTime(row.updatedAt)}</p>
        <TimeAgo iso={row.updatedAt} prefix="" />
      </td>
    </tr>
  );
}
