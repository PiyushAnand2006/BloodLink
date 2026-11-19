"use client";

import { useState } from "react";
import { bloodGroupLabel, BLOOD_GROUPS } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { useDonorSearch } from "@/hooks/useApiData";
import { useMe } from "@/hooks/useMe";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select, Input, Field } from "@/components/ui/forms";
import { SearchIcon, PhoneIcon, StarIcon, ShieldCheckIcon } from "@/components/ui/icons";

function DonorSearchInner() {
  const { user } = useMe();
  const [filters, setFilters] = useState({
    bloodGroup: "",
    city: "",
    pincode: "",
    rareOnly: false,
  });
  const [searched, setSearched] = useState(false);

  const { data, isLoading, error } = useDonorSearch(
    searched
      ? { bloodGroup: filters.bloodGroup, city: filters.city, pincode: filters.pincode, rareOnly: filters.rareOnly }
      : { bloodGroup: undefined, city: undefined, pincode: undefined, rareOnly: false },
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false, refreshInterval: 0 },
  );

  const verified = user?.orgProfile?.isVerified ?? false;
  const results = data?.donors ?? [];

  return (
    <div className="py-2">
      <PageHeader
        title="Find donors"
        subtitle="Available and currently-eligible donors, searchable by verified hospitals only."
      />

      {!verified && (
        <p className="mb-4 flex items-start gap-2 rounded border border-[#F5E6B8] bg-[#FFF7E0] px-3 py-2 text-sm text-[#8a6d00]">
          <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Your hospital account is pending verification. An administrator must verify it before
          donor search unlocks and phone numbers become visible.
        </p>
      )}

      <Card className="mb-5">
        <CardBody>
          <form
            className="grid items-end gap-3 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSearched(true);
            }}
          >
            <Field label="Blood group" htmlFor="s-bg">
              <Select
                id="s-bg"
                value={filters.bloodGroup}
                onChange={(e) => setFilters((f) => ({ ...f, bloodGroup: e.target.value }))}
              >
                <option value="">Any group</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City" htmlFor="s-city">
              <Input
                id="s-city"
                placeholder="e.g. Bengaluru"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              />
            </Field>
            <Field label="Pincode" htmlFor="s-pincode">
              <Input
                id="s-pincode"
                inputMode="numeric"
                placeholder="e.g. 560076"
                value={filters.pincode}
                onChange={(e) => setFilters((f) => ({ ...f, pincode: e.target.value }))}
              />
            </Field>
            <div className="flex items-end gap-3">
              <label className="flex h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#C62828]"
                  checked={filters.rareOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, rareOnly: e.target.checked }))}
                />
                <span className="flex items-center gap-1 font-semibold text-navy">
                  <StarIcon className="h-3.5 w-3.5 text-warning" />
                  Rare only
                </span>
              </label>
              <Button type="submit" disabled={!verified}>
                <SearchIcon className="h-4 w-4" />
                Search
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {error && (
        <p className="mb-4 rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {(error as Error).message}
        </p>
      )}

      {!searched ? (
        <EmptyState
          icon={<SearchIcon />}
          title="Search for donors"
          hint="Only donors who are marked available AND have completed the 90-day donation gap are listed."
        />
      ) : isLoading ? (
        <p className="text-sm text-muted">Searching…</p>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No donors match"
          hint="Try widening the filters, or check the dashboard for compatible stock units."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle text-left text-2xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Donor</th>
                <th className="px-4 py-3 font-semibold">Group</th>
                <th className="px-4 py-3 font-semibold">Age</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Last donated</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {results.map((d) => (
                <tr key={d.id} className="hover:bg-subtle/50">
                  <td className="px-4 py-3 font-semibold text-navy">
                    {d.name}
                    {d.isRare && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-[#FFF7E0] px-1.5 py-0.5 text-2xs font-bold text-[#8a6d00]">
                        <StarIcon className="h-3 w-3" />
                        Rare
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary-50 px-2 py-0.5 font-bold text-primary">
                      {bloodGroupLabel(d.bloodGroup)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{d.age}</td>
                  <td className="px-4 py-3 text-muted">
                    {d.city}
                    {d.pincode ? ` · ${d.pincode}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {d.lastDonatedOn ? fmtDate(d.lastDonatedOn) : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      className="inline-flex items-center gap-1.5 font-semibold text-info hover:underline"
                      href={`tel:${d.phone}`}
                    >
                      <PhoneIcon className="h-3.5 w-3.5" />
                      {d.phone}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default function HospitalDonorsPage() {
  return (
    <ProtectedShell allow={["HOSPITAL"]}>
      <DonorSearchInner />
    </ProtectedShell>
  );
}
