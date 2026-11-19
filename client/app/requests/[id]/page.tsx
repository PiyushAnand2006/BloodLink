"use client";

import { use } from "react";
import Link from "next/link";
import { useRequest } from "@/hooks/useApiData";
import { useMe } from "@/hooks/useMe";
import { bloodGroupLabel, componentLabel, roleHome, type ApiRequest, type BloodGroup } from "@/lib/constants";
import { WHOLE_BLOOD_COMPATIBILITY } from "@/lib/format";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { MapPinIcon, PhoneIcon, PersonIcon } from "@/components/ui/icons";

function RequestDetail({ id }: { id: string }) {
  const { data, isLoading } = useRequest(id);
  const { user } = useMe();

  if (isLoading && !data) return <PageSpinner />;
  if (!data?.request) {
    return (
      <EmptyState
        title="Request not found"
        hint="It may have been removed by the hospital that raised it."
        action={
          <Link href="/requests" className="text-sm font-semibold text-info hover:underline">
            Back to all requests →
          </Link>
        }
      />
    );
  }

  const request = data.request;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <PageHeader
        title="Emergency request"
        subtitle={`Raised ${new Date(request.createdAt).toLocaleString("en-IN")}`}
        actions={
          request.isOwner ? (
            <Link href="/hospital/requests">
              <Button variant="secondary" size="sm">
                Manage in hospital console
              </Button>
            </Link>
          ) : user?.role ? (
            <Link href={roleHome(user.role)}>
              <Button variant="secondary" size="sm">
                Your workspace
              </Button>
            </Link>
          ) : undefined
        }
      />

      <RequestCard request={request} showStatus />

      {/* Hospital contact card — phone appears only for logged-in responders on OPEN requests. */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy">Requesting hospital</h2>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <p className="flex items-center gap-2 font-semibold text-navy">
            <PersonIcon className="h-4 w-4 text-muted" />
            {request.hospital.orgName}
            {request.hospital.contactPerson && (
              <span className="font-normal text-muted">· {request.hospital.contactPerson}</span>
            )}
          </p>
          <p className="flex items-center gap-2 text-muted">
            <MapPinIcon className="h-4 w-4" />
            {request.city}
            {request.pincode ? ` — ${request.pincode}` : ""}
          </p>
          {request.hospitalPhone ? (
            <p className="flex items-center gap-2 font-semibold text-success">
              <PhoneIcon className="h-4 w-4" />
              <a href={`tel:${request.hospitalPhone}`} className="text-info hover:underline">
                {request.hospitalPhone}
              </a>
              <span className="text-xs font-normal text-muted">
                (visible to you as a logged-in responder on this open request)
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted">
              Hospital phone numbers are shared only with logged-in donors, NGOs and blood banks
              while a request is open.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Compatibility hint */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy">Who can donate {componentLabel(request.component)}?</h2>
        </CardHeader>
        <CardBody>
          <CompatibilityHint request={request} />
        </CardBody>
      </Card>
    </div>
  );
}

function CompatibilityHint({ request }: { request: ApiRequest }) {
  const compatible = getCompatible(request.bloodGroup, request.component);
  return (
    <div className="flex flex-wrap gap-2">
      {compatible.map((g) => (
        <span key={g} className="rounded bg-primary-50 px-2.5 py-1 text-sm font-bold text-primary">
          {bloodGroupLabel(g)}
        </span>
      ))}
      <p className="w-full text-xs text-muted">
        {request.component === "WHOLE_BLOOD"
          ? "Whole-blood compatibility (donor → patient)."
          : "Platelet and plasma transfusions need an exact blood-group match."}
      </p>
    </div>
  );
}

function getCompatible(group: ApiRequest["bloodGroup"], component: ApiRequest["component"]): BloodGroup[] {
  if (component === "WHOLE_BLOOD") return WHOLE_BLOOD_COMPATIBILITY[group];
  return [group];
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequestDetail id={id} />;
}
