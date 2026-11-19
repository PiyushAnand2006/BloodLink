"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { bloodGroupLabel, componentLabel, type ApiMyResponseRow } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { useMyResponses } from "@/hooks/useApiData";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponseStatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/TimeBits";
import { ClockIcon, MapPinIcon } from "@/components/ui/icons";

const RESPONDER = ["DONOR", "NGO", "BLOOD_BANK"] as const;

function MyResponsesInner() {
  const { data, isLoading, mutate } = useMyResponses();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const setDeclined = (row: ApiMyResponseRow) =>
    act(row.id, () => api(`/responses/${row.id}`, { method: "PATCH", body: { status: "DECLINED" } }));
  const repledge = (row: ApiMyResponseRow) =>
    act(row.id, () => api(`/responses/${row.id}`, { method: "PATCH", body: { status: "PLEDGED" } }));
  const withdraw = (row: ApiMyResponseRow) =>
    act(row.id, () => api(`/responses/${row.id}`, { method: "DELETE" }));

  if (isLoading && !data) return <PageSpinner />;

  return (
    <div className="py-2">
      <PageHeader
        title="My responses"
        subtitle="Every request you have pledged, declined or donated for."
        actions={
          <Link href="/requests" className="text-sm font-semibold text-info hover:underline">
            Browse requests →
          </Link>
        }
      />

      {error && (
        <p className="mb-4 rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {data && data.responses.length === 0 ? (
        <EmptyState
          icon={<ClockIcon />}
          title="No responses yet"
          hint="When you pledge on an emergency request, it shows up here with its live status."
          action={
            <Link href="/requests" className="text-sm font-semibold text-info hover:underline">
              Find requests to pledge →
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {data?.responses.map((row) => (
            <li key={row.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <UrgencyBadge urgency={row.request.urgency} />
                  <ResponseStatusBadge status={row.status} />
                  <span className="ml-auto flex items-center gap-1 text-2xs text-muted">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {row.request.city}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xl font-bold text-primary">
                    {bloodGroupLabel(row.request.bloodGroup)}
                  </span>
                  <span className="text-sm font-semibold text-navy">{row.request.patientName}</span>
                  <span className="text-sm text-muted">
                    {row.request.units} unit{row.request.units > 1 ? "s" : ""} ·{" "}
                    {componentLabel(row.request.component)}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                  <span>{row.request.hospitalName}</span>
                  <Countdown neededBy={row.request.neededBy} />
                </div>

                {row.message && <p className="mt-2 rounded bg-subtle px-3 py-2 text-xs text-muted">“{row.message}”</p>}

                <p className="mt-2 text-2xs text-muted">Responded {fmtDateTime(row.createdAt)}</p>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {row.status === "PLEDGED" && (
                    <>
                      <Link href={`/requests/${row.request.id}`}>
                        <Button size="sm" variant="secondary">
                          View request
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === row.id}
                        onClick={() => void setDeclined(row)}
                      >
                        Can't make it
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === row.id}
                        onClick={() => void withdraw(row)}
                      >
                        Withdraw
                      </Button>
                    </>
                  )}
                  {row.status === "DECLINED" && (
                    <>
                      <Button
                        size="sm"
                        disabled={busyId === row.id}
                        onClick={() => void repledge(row)}
                      >
                        Pledge again
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === row.id}
                        onClick={() => void withdraw(row)}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                  {row.status === "DONATED" && (
                    <p className="text-xs font-semibold text-success">
                      ✓ Marked as donated by the hospital. Thank you!
                    </p>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyResponsesPage() {
  return (
    <ProtectedShell allow={[...RESPONDER]}>
      <MyResponsesInner />
    </ProtectedShell>
  );
}
