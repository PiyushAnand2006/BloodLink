"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/lib/api";
import { BLOOD_GROUPS, GENDERS, bloodGroupLabel } from "@/lib/constants";
import { ageFrom, dateInputValue, eligibleFrom, fmtDate, isEligible } from "@/lib/format";
import { useDonorMe } from "@/hooks/useApiData";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Toggle } from "@/components/ui/forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, DropIcon } from "@/components/ui/icons";

function DonorInner() {
  const { data, isLoading, mutate } = useDonorMe();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    values: data
      ? {
          bloodGroup: data.profile.bloodGroup,
          dateOfBirth: dateInputValue(new Date(data.profile.dateOfBirth)),
          gender: data.profile.gender,
          isRare: data.profile.isRare,
          lastDonatedOn: data.profile.lastDonatedOn ? dateInputValue(new Date(data.profile.lastDonatedOn)) : "",
        }
      : undefined,
  });

  if (isLoading && !data) return <PageSpinner />;
  if (!data) return <PageSpinner label="Donor profile not found" />;

  const profile = data.profile;
  const eligible = isEligible(profile.lastDonatedOn);
  const from = eligible ? null : eligibleFrom(profile.lastDonatedOn);

  const saveAvailability = async (isAvailable: boolean) => {
    setMessage(null);
    setError(null);
    try {
      await api("/donor/me/availability", { method: "PATCH", body: { isAvailable } });
      await mutate();
      setMessage(isAvailable ? "You are now marked available." : "You are now marked unavailable.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update availability");
    }
  };

  const markDonatedToday = async () => {
    setMessage(null);
    setError(null);
    try {
      await api("/donor/me", {
        method: "PUT",
        body: {
          bloodGroup: profile.bloodGroup,
          dateOfBirth: dateInputValue(new Date(profile.dateOfBirth)),
          gender: profile.gender,
          isRare: profile.isRare,
          lastDonatedOn: dateInputValue(new Date()),
        },
      });
      await mutate();
      setMessage("Marked as donated today — you'll be eligible again in 90 days.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not record donation");
    }
  };

  const saveDetails = form.handleSubmit(async (values) => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api("/donor/me", {
        method: "PUT",
        body: {
          bloodGroup: values.bloodGroup,
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
          isRare: values.isRare,
          lastDonatedOn: values.lastDonatedOn || null,
        },
      });
      await mutate();
      setMessage("Donor details saved.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save donor details");
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <PageHeader
        title="My availability"
        subtitle="Keep this up to date so hospitals only see you when you can actually donate."
        actions={
          <Link href="/my-responses" className="text-sm font-semibold text-info hover:underline">
            My pledges →
          </Link>
        }
      />

      {message && (
        <p className="rounded border border-success/30 bg-[#EAF5EB] px-3 py-2 text-sm font-semibold text-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {/* Availability + eligibility */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy">Availability</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Toggle
            label="Available for emergency donation"
            description="Only available AND eligible donors appear on the dashboard and in hospital searches."
            checked={profile.isAvailable}
            onChange={(next) => void saveAvailability(next)}
          />

          <div
            className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
              eligible ? "border border-success/30 bg-[#EAF5EB]" : "border border-[#F5E6B8] bg-[#FFF7E0]"
            }`}
          >
            {eligible ? (
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            ) : (
              <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6d00]" />
            )}
            <div className="text-sm">
              {eligible ? (
                <>
                  <p className="font-semibold text-success">You are eligible to donate</p>
                  {profile.lastDonatedOn && (
                    <p className="text-muted">Last donated {fmtDate(profile.lastDonatedOn)} — 90-day gap completed.</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold text-[#8a6d00]">
                    Eligible from {from ? fmtDate(from) : "—"}
                  </p>
                  <p className="text-muted">
                    Last donated {fmtDate(profile.lastDonatedOn!)} — donors must wait 90 days between whole-blood donations.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => void markDonatedToday()}>
              I donated today
            </Button>
            <span className="text-xs text-muted">
              Records today as your last donation and starts the 90-day countdown.
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Donor details */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy">Donor details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={saveDetails} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Blood group" required htmlFor="d-bg">
              <Select id="d-bg" {...form.register("bloodGroup")}>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Gender" required htmlFor="d-gender">
              <Select id="d-gender" {...form.register("gender")}>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date of birth" required htmlFor="d-dob" error={form.formState.errors.dateOfBirth}>
              <Input id="d-dob" type="date" {...form.register("dateOfBirth")} />
            </Field>
            <Field
              label="Last donated on"
              htmlFor="d-last"
              hint="Leave empty if you have never donated"
            >
              <Input id="d-last" type="date" {...form.register("lastDonatedOn")} />
            </Field>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#C62828]" {...form.register("isRare")} />
                <span>
                  <span className="font-semibold text-navy">Rare blood group</span>
                  <span className="block text-xs text-muted">
                    Negative groups (A−, B−, AB−, O−) are flagged as rare and highlighted on dashboards.
                    Currently: {profile.isRare ? "flagged rare" : "not flagged"}
                  </span>
                </span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                Save details
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Summary strip */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <span className="flex items-center gap-2">
            <DropIcon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-navy">{bloodGroupLabel(profile.bloodGroup)}</span>
            <span className="text-muted">blood group</span>
          </span>
          <span className="flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 text-muted" />
            <span className="font-semibold text-navy">{ageFrom(profile.dateOfBirth)} yrs</span>
            <span className="text-muted">age</span>
          </span>
          <span className="text-muted">
            {profile.isRare ? "Rare group — hospitals especially value your pledges." : "Thank you for being a donor."}
          </span>
        </CardBody>
      </Card>
    </div>
  );
}

export default function DonorPage() {
  return (
    <ProtectedShell allow={["DONOR"]}>
      <DonorInner />
    </ProtectedShell>
  );
}
