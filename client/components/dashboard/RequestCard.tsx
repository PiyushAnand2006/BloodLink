"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  bloodGroupLabel,
  componentLabel,
  type ApiRequest,
} from "@/lib/constants";
import { useMe } from "@/hooks/useMe";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UrgencyBadge, RequestStatusBadge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/TimeBits";
import { BoxIcon, MapPinIcon, PersonIcon, PhoneIcon } from "@/components/ui/icons";

const RESPONDER_ROLES = ["DONOR", "NGO", "BLOOD_BANK"];

/**
 * Emergency request card for the public feed + dashboard.
 * Includes the "I can donate" pledge flow (login-gated) and the hospital
 * phone, which the server only reveals to logged-in responders on OPEN requests.
 */
export function RequestCard({ request, showStatus = false }: { request: ApiRequest; showStatus?: boolean }) {
  const { user, refresh } = useMe();
  const router = useRouter();
  const [pledging, setPledging] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const canPledge = !user || (user.role !== null && RESPONDER_ROLES.includes(user.role));

  const startPledge = () => {
    setError(null);
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/requests")}`);
      return;
    }
    setShowMessage(true);
  };

  const submitPledge = async () => {
    setPledging(true);
    setError(null);
    try {
      await api(`/requests/${request.id}/responses`, {
        method: "POST",
        body: message.trim() ? { message: message.trim() } : {},
      });
      setShowMessage(false);
      setDone("Pledged — thank you! The hospital can now see your contact details.");
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setPledging(false);
    }
  };

  const myStatus = request.myResponseStatus;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <UrgencyBadge urgency={request.urgency} />
        {showStatus && <RequestStatusBadge status={request.status} />}
        <span className="ml-auto flex items-center gap-1.5 text-2xs font-semibold text-muted">
          <MapPinIcon className="h-3.5 w-3.5" />
          {request.city}
          {request.pincode ? ` · ${request.pincode}` : ""}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-bold tracking-tight text-primary">
          {bloodGroupLabel(request.bloodGroup)}
        </span>
        <span className="text-sm font-semibold text-navy">{request.patientName}</span>
        <span className="flex items-center gap-1 text-sm text-muted">
          <BoxIcon className="h-3.5 w-3.5" />
          {request.units} unit{request.units > 1 ? "s" : ""} · {componentLabel(request.component)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <PersonIcon className="h-3.5 w-3.5" />
          {request.hospital.orgName}
        </span>
        <Countdown neededBy={request.neededBy} />
      </div>

      {request.note && <p className="mt-2 rounded bg-subtle px-3 py-2 text-xs text-muted">{request.note}</p>}

      {request.hospitalPhone && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success">
          <PhoneIcon className="h-3.5 w-3.5" />
          Hospital contact:
          <a className="text-info" href={`tel:${request.hospitalPhone}`}>
            {request.hospitalPhone}
          </a>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {myStatus ? (
          <span className="text-xs font-semibold text-success">✓ You {myStatus.toLowerCase()} this request</span>
        ) : (
          request.status === "OPEN" &&
          canPledge && (
            <Button size="sm" onClick={startPledge} disabled={pledging}>
              I can donate
            </Button>
          )
        )}
        <Link
          href={`/requests/${request.id}`}
          className="ml-auto text-xs font-semibold text-info hover:underline"
        >
          View details →
        </Link>
      </div>

      {showMessage && (
        <div className="mt-3 space-y-2 rounded border border-line bg-subtle p-3">
          <textarea
            className="min-h-[56px] w-full rounded border border-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            placeholder="Optional message for the hospital (e.g. when you can reach)"
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={submitPledge} loading={pledging}>
              Confirm pledge
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowMessage(false)} disabled={pledging}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-danger" role="alert">{error}</p>}
      {done && <p className="mt-2 text-xs font-semibold text-success" role="status">{done}</p>}
      {!user && request.status === "OPEN" && (
        <p className="mt-2 text-2xs text-muted">Sign in as a donor, NGO or blood bank to pledge.</p>
      )}
    </Card>
  );
}
