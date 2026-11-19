"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCamps, useDashboard, useRequests } from "@/hooks/useApiData";
import { useMe } from "@/hooks/useMe";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WhatsNewTicker } from "@/components/home/WhatsNewTicker";
import { BloodGroupTile } from "@/components/dashboard/BloodGroupTile";
import { RareBanner } from "@/components/dashboard/RareBanner";
import { SummaryFilters } from "@/components/dashboard/SummaryFilters";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { CampsStrip } from "@/components/dashboard/CampsStrip";
import { PageSpinner } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { DropIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { TimeAgo } from "@/components/ui/TimeBits";

function DashboardInner() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    city: searchParams.get("city") ?? "",
    component: searchParams.get("component") ?? "WHOLE_BLOOD",
  }));
  const { data, isLoading } = useDashboard(filters.city, filters.component);
  const { data: feed } = useRequests({ city: filters.city, component: filters.component });
  const { data: camps } = useCamps({ city: filters.city });
  const { user } = useMe();

  return (
    <div className="py-2">
      <PageHeader
        title="Live blood availability"
        subtitle="Donors available + stock units per blood group, refreshed every 20 seconds."
        actions={
          <div className="flex items-center gap-3">
            <TimeAgo iso={data?.updatedAt ?? null} />
            <Link href="/availability" className="text-sm font-semibold text-info hover:underline">
              Search by district →
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        <WhatsNewTicker />

        <SummaryFilters city={filters.city} component={filters.component} onChange={setFilters} />

        <RareBanner count={data?.rareDonorsAvailable} city={filters.city} />

        {isLoading && !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg border border-line bg-surface" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data?.summary.map((item) => (
              <BloodGroupTile key={item.bloodGroup} item={item} />
            ))}
          </div>
        )}

        {/* Emergency feed */}
        <section aria-labelledby="emergency-feed">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="emergency-feed" className="text-base font-semibold text-navy">
              Emergency requests
            </h2>
            {user?.role === "HOSPITAL" ? (
              <div className="flex items-center gap-3">
                <Link href="/hospital/requests" className="text-xs font-semibold text-info hover:underline">
                  My requests →
                </Link>
                <Link href="/hospital/requests/new" className="text-xs font-semibold text-primary hover:underline">
                  + New request
                </Link>
              </div>
            ) : (
              <Link href="/requests" className="text-xs font-semibold text-info hover:underline">
                All requests →
              </Link>
            )}
          </div>
          {feed && feed.requests.length === 0 ? (
            <EmptyState
              icon={<DropIcon />}
              title="No open requests"
              hint={
                user?.role === "HOSPITAL"
                  ? "Your hospital hasn't posted any open requests. Raise one when you need units urgently."
                  : "There are currently no open emergency requests matching these filters."
              }
              action={
                user?.role === "HOSPITAL" ? (
                  <Link href="/hospital/requests/new" className="text-sm font-semibold text-info hover:underline">
                    Post a request →
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {(feed?.requests ?? []).slice(0, 6).map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>
          )}
        </section>

        {camps?.camps && <CampsStrip camps={camps.camps} />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    // The main dashboard is for signed-in members; guests are invited to sign in.
    <ProtectedShell>
      {/* Suspense boundary required by Next prerendering for useSearchParams. */}
      <Suspense fallback={<PageSpinner />}>
        <DashboardInner />
      </Suspense>
    </ProtectedShell>
  );
}
