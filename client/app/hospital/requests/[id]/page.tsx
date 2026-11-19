"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { bloodGroupLabel, componentLabel, type ApiResponderRow } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { useRequest, useResponses } from "@/hooks/useApiData";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { RequestStatusBadge, ResponseStatusBadge, UrgencyBadge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/TimeBits";
import { RequestForm } from "@/components/requests/RequestForm";
import { BoxIcon, ClockIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";

function RequestConsole({ id }: { id: string }) {
  const { data, isLoading, mutate } = useRequest(id);
  const { data: responses, mutate: mutateResponses } = useResponses(id);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyResponder, setBusyResponder] = useState<string | null>(null);

  if (isLoading && !data) return <PageSpinner />;
  if (!data?.request || !data.request.isOwner) {
    return (
      <EmptyState
        title="Request not found in your hospital console"
        hint="This request either doesn't exist or was raised by another hospital."
        action={
          <Link href="/hospital/requests" className="text-sm font-semibold text-info hover:underline">
            Back to my requests →
          </Link>
        }
      />
    );
  }

  const request = data.request;

  const setStatus = async (status: string) => {
    setError(null);
    try {
      await api(`/requests/${id}/status`, { method: "PATCH", body: { status } });
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update status");
    }
  };

  const markDonated = async (responseId: string) => {
    setBusyResponder(responseId);
    setError(null);
    try {
      await api(`/responses/${responseId}`, { method: "PATCH", body: { status: "DONATED" } });
      await mutateResponses();
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not mark donation");
    } finally {
      setBusyResponder(null);
    }
  };

  const remove = async () => {
    try {
      await api(`/requests/${id}`, { method: "DELETE" });
      router.push("/hospital/requests");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete request");
    }
  };

  const pledged = (responses?.responses ?? []).filter(
    (r) => r.status === "PLEDGED" || r.status === "DONATED",
  );

  return (
    <div className="space-y-6 py-2">
      <PageHeader
        title={`Request console — ${bloodGroupLabel(request.bloodGroup)} ${componentLabel(request.component)}`}
        subtitle={`${request.units} unit${request.units > 1 ? "s" : ""} for ${request.patientName}`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <ConfirmButton label="Delete request" size="md" onConfirm={remove} />
          </div>
        }
      />

      {error && (
        <p className="rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {/* Status + summary */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <UrgencyBadge urgency={request.urgency} />
            <RequestStatusBadge status={request.status} />
            <Countdown neededBy={request.neededBy} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4" />
              {request.city} · {request.pincode}
            </span>
            <span className="flex items-center gap-1.5">
              <BoxIcon className="h-4 w-4" />
              {request.units} unit{request.units > 1 ? "s" : ""} · {componentLabel(request.component)}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              Needed by {new Date(request.neededBy).toLocaleString("en-IN")}
            </span>
          </div>
          {request.note && <p className="rounded bg-subtle px-3 py-2 text-xs text-muted">{request.note}</p>}

          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            {request.status === "OPEN" ? (
              <>
                <Button size="sm" variant="success" onClick={() => void setStatus("FULFILLED")}>
                  Mark request fulfilled
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void setStatus("CLOSED")}>
                  Close request
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => void setStatus("OPEN")}>
                Reopen request
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Responders */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy">
            Responders{" "}
            <span className="ml-1 rounded-full bg-primary-50 px-2 py-0.5 text-2xs font-bold text-primary">
              {pledged.length} active
            </span>
          </h2>
        </CardHeader>
        <CardBody>
          {responses && responses.responses.length === 0 ? (
            <p className="py-4 text-sm text-muted">
              No pledges yet — the request is live on the dashboard and emergency feed; donors can
              pledge at any time.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {responses?.responses.map((row) => (
                <ResponderRow
                  key={row.id}
                  row={row}
                  busy={busyResponder === row.id}
                  onMarkDonated={() => void markDonated(row.id)}
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={editing} title="Edit request" onClose={() => setEditing(false)} wide>
        <RequestForm
          existing={request}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await mutate();
          }}
        />
      </Modal>
    </div>
  );
}

function ResponderRow({
  row,
  busy,
  onMarkDonated,
}: {
  row: ApiResponderRow;
  busy: boolean;
  onMarkDonated: () => void;
}) {
  const r = row.responder;
  const showPhone = row.status === "PLEDGED" || row.status === "DONATED";

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-navy">{r.name}</span>
          <ResponseStatusBadge status={row.status} />
          {r.bloodGroup && (
            <span className="rounded bg-primary-50 px-1.5 py-0.5 text-2xs font-bold text-primary">
              {bloodGroupLabel(r.bloodGroup)}
              {r.isRare ? " · rare" : ""}
            </span>
          )}
          {r.orgName && <span className="text-xs text-muted">({r.orgName})</span>}
        </div>
        <p className="mt-1 text-xs text-muted">
          {r.city ?? "—"}
          {r.contactPerson ? ` · contact: ${r.contactPerson}` : ""} · responded{" "}
          {fmtDateTime(row.createdAt)}
        </p>
        {row.message && <p className="mt-1 text-xs italic text-muted">“{row.message}”</p>}
        {showPhone ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-success">
            <PhoneIcon className="h-4 w-4" />
            <a className="text-info hover:underline" href={`tel:${r.phone}`}>
              {r.phone}
            </a>
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted">Phone hidden — responder declined.</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {row.status === "PLEDGED" && (
          <Button size="sm" variant="success" loading={busy} onClick={onMarkDonated}>
            Mark donated
          </Button>
        )}
      </div>
    </li>
  );
}

export default function HospitalRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedShell allow={["HOSPITAL"]}>
      <RequestConsole id={id} />
    </ProtectedShell>
  );
}
