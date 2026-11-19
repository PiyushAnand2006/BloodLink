"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { bloodGroupLabel, componentLabel, type ApiRequest } from "@/lib/constants";
import { useMe } from "@/hooks/useMe";
import { useRequests } from "@/hooks/useApiData";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { RequestStatusBadge, UrgencyBadge, VerifiedBadge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/TimeBits";
import { RequestForm } from "@/components/requests/RequestForm";
import { ClockIcon, MapPinIcon, PersonIcon, PlusIcon } from "@/components/ui/icons";

function HospitalRequestsInner() {
  const { data, mutate } = useRequests({ mine: true });
  const { user } = useMe();
  const [editing, setEditing] = useState<ApiRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (id: string, status: string) => {
    setError(null);
    try {
      await api(`/requests/${id}/status`, { method: "PATCH", body: { status } });
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update status");
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await api(`/requests/${id}`, { method: "DELETE" });
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete request");
    }
  };

  const verified = user?.orgProfile?.isVerified ?? false;

  return (
    <div className="py-2">
      <PageHeader
        title="My requests"
        subtitle="Emergency requests raised by your hospital."
        actions={
          <Link href="/hospital/requests/new">
            <Button size="sm">
              <PlusIcon className="h-4 w-4" />
              New request
            </Button>
          </Link>
        }
      />

      {!verified && (
        <p className="mb-4 rounded border border-[#F5E6B8] bg-[#FFF7E0] px-3 py-2 text-xs text-[#8a6d00]">
          Your hospital is pending verification — requests can be posted now, but donor search stays
          locked until an administrator verifies the account.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {data && data.requests.length === 0 ? (
        <EmptyState
          icon={<ClockIcon />}
          title="No requests yet"
          hint="Post your first emergency blood request — it goes live on the public dashboard instantly."
          action={
            <Link href="/hospital/requests/new" className="text-sm font-semibold text-info hover:underline">
              + New request
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {data?.requests.map((r) => (
            <li key={r.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <UrgencyBadge urgency={r.urgency} />
                  <RequestStatusBadge status={r.status} />
                  <span className="ml-auto flex items-center gap-1 text-2xs text-muted">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {r.city} · {r.pincode}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xl font-bold text-primary">{bloodGroupLabel(r.bloodGroup)}</span>
                  <span className="text-sm font-semibold text-navy">{r.patientName}</span>
                  <span className="text-sm text-muted">
                    {r.units} unit{r.units > 1 ? "s" : ""} · {componentLabel(r.component)}
                  </span>
                  <Countdown neededBy={r.neededBy} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5 font-semibold text-navy">
                    <PersonIcon className="h-4 w-4" />
                    {r.respondersCount} pledged or donated
                  </span>
                  <span className="text-2xs">Posted {new Date(r.createdAt).toLocaleString("en-IN")}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <Link href={`/hospital/requests/${r.id}`}>
                    <Button size="sm">Open console</Button>
                  </Link>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                    Edit
                  </Button>
                  {r.status === "OPEN" ? (
                    <>
                      <Button size="sm" variant="success" onClick={() => void setStatus(r.id, "FULFILLED")}>
                        Mark fulfilled
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void setStatus(r.id, "CLOSED")}>
                        Close
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => void setStatus(r.id, "OPEN")}>
                      Reopen
                    </Button>
                  )}
                  <ConfirmButton
                    className="ml-auto"
                    label="Delete"
                    onConfirm={() => remove(r.id)}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} title="Edit request" onClose={() => setEditing(null)} wide>
        {editing && (
          <RequestForm
            existing={editing}
            onCancel={() => setEditing(null)}
            onSaved={async (updated) => {
              setEditing(null);
              await mutate();
              void updated;
            }}
          />
        )}
      </Modal>
    </div>
  );
}

export default function HospitalRequestsPage() {
  return (
    <ProtectedShell allow={["HOSPITAL"]}>
      <HospitalRequestsInner />
    </ProtectedShell>
  );
}
