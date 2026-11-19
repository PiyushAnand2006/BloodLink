"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { bloodGroupLabel, type ApiRequest } from "@/lib/constants";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { RequestForm } from "@/components/requests/RequestForm";
import { CheckCircleIcon } from "@/components/ui/icons";

function NewRequestInner() {
  const router = useRouter();
  const [saved, setSaved] = useState<ApiRequest | null>(null);

  if (saved) {
    return (
      <div className="mx-auto max-w-xl py-8 text-center">
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-10">
            <CheckCircleIcon className="h-12 w-12 text-success" />
            <h2 className="text-lg font-semibold text-navy">
              Request for {bloodGroupLabel(saved.bloodGroup)} posted!
            </h2>
            <p className="max-w-sm text-sm text-muted">
              It is now live on the public dashboard and in the emergency feed. Donors can pledge
              immediately — you will see their contact details in the request console.
            </p>
            <div className="mt-2 flex gap-2">
              <Button onClick={() => router.push(`/hospital/requests/${saved.id}`)}>
                Open request console
              </Button>
              <Button variant="secondary" onClick={() => router.push("/hospital/requests")}>
                My requests
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-2">
      <PageHeader
        title="Post an emergency blood request"
        subtitle="Goes live on the public dashboard and emergency feed immediately."
      />
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy">Request details</h2>
        </CardHeader>
        <CardBody>
          <RequestForm
            onSaved={(request) => setSaved(request)}
          />
        </CardBody>
      </Card>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <ProtectedShell allow={["HOSPITAL"]}>
      <NewRequestInner />
    </ProtectedShell>
  );
}
