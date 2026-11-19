"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ROLE_META, bloodGroupLabel } from "@/lib/constants";
import { useMe } from "@/hooks/useMe";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { VerifiedBadge } from "@/components/ui/Badge";
import { CheckCircleIcon } from "@/components/ui/icons";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode"),
});
type ProfileValues = z.infer<typeof profileSchema>;

function ProfileInner() {
  const { user, refresh } = useMe();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          name: user.name,
          phone: user.phone ?? "",
          city: user.city ?? "",
          state: user.state ?? "",
          pincode: user.pincode ?? "",
        }
      : undefined,
  });

  if (!user) return <PageSpinner />;

  const onSubmit = async (values: ProfileValues) => {
    setMessage(null);
    setError(null);
    try {
      await api("/profile", { method: "PUT", body: values });
      await refresh();
      setMessage("Profile saved.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save profile");
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api("/profile", { method: "DELETE" });
      await refresh();
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete account");
      setDeleting(false);
    }
  };

  const role = user.role;

  return (
    <div className="mx-auto max-w-2xl py-4">
      <PageHeader title="Your profile" subtitle={user.email} />

      {message && <p className="mb-4 rounded border border-success/30 bg-[#EAF5EB] px-3 py-2 text-sm font-semibold text-success" role="status">{message}</p>}
      {error && <p className="mb-4 rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">{error}</p>}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-navy">Account details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Full name" error={errors.name} required htmlFor="name">
              <Input id="name" {...register("name")} />
            </Field>
            <Field label="Mobile number" error={errors.phone} required htmlFor="phone">
              <Input id="phone" inputMode="numeric" {...register("phone")} />
            </Field>
            <Field label="City" error={errors.city} required htmlFor="city">
              <Input id="city" {...register("city")} />
            </Field>
            <Field label="State" error={errors.state} required htmlFor="state">
              <Input id="state" {...register("state")} />
            </Field>
            <Field label="Pincode" error={errors.pincode} required htmlFor="pincode">
              <Input id="pincode" inputMode="numeric" {...register("pincode")} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" loading={deleting && false} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {role === "DONOR" && user.donorProfile && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-navy">Donor profile</h2>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">Blood group</dt>
                <dd className="font-semibold text-navy">{bloodGroupLabel(user.donorProfile.bloodGroup)}</dd>
              </div>
              <div>
                <dt className="text-muted">Availability</dt>
                <dd className="font-semibold text-navy">{user.donorProfile.isAvailable ? "Available" : "Unavailable"}</dd>
              </div>
              <div>
                <dt className="text-muted">Rare group</dt>
                <dd className="font-semibold text-navy">{user.donorProfile.isRare ? "Yes" : "No"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">
              Manage availability, eligibility and donor details from{" "}
              <a href="/donor" className="font-semibold text-info hover:underline">
                My availability →
              </a>
            </p>
          </CardBody>
        </Card>
      )}

      {(role === "NGO" || role === "BLOOD_BANK" || role === "HOSPITAL") && user.orgProfile && (
        <Card className="mb-6">
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Organisation profile</h2>
            <VerifiedBadge verified={user.orgProfile.isVerified} />
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Name</dt>
                <dd className="font-semibold text-navy">{user.orgProfile.orgName}</dd>
              </div>
              <div>
                <dt className="text-muted">Registration no.</dt>
                <dd className="font-semibold text-navy">{user.orgProfile.regNo}</dd>
              </div>
              <div>
                <dt className="text-muted">Address</dt>
                <dd className="font-semibold text-navy">{user.orgProfile.address}</dd>
              </div>
              <div>
                <dt className="text-muted">Contact person</dt>
                <dd className="font-semibold text-navy">{user.orgProfile.contactPerson}</dd>
              </div>
            </dl>
            {role === "HOSPITAL" && !user.orgProfile.isVerified && (
              <p className="mt-3 flex items-start gap-2 rounded bg-[#FFF7E0] px-3 py-2 text-xs text-[#8a6d00]">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                Donor search unlocks once a BloodLink administrator verifies your hospital account.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      <Card className="border-danger/30">
        <CardHeader>
          <h2 className="font-semibold text-danger">Danger zone</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-sm text-muted">
              Deleting your account removes your {role === "DONOR" ? "donor profile and pledges" : "listings, requests and responses"} permanently.
            </p>
            <ConfirmButton
              label="Delete account"
              confirmLabel="Click again to confirm"
              onConfirm={deleteAccount}
            />
          </div>
        </CardBody>
      </Card>

      <p className="mt-4 text-2xs text-muted">
        Role: {role ? ROLE_META[role].label : "not set"} · Member since{" "}
        {new Date(user.createdAt).toLocaleDateString("en-IN")}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedShell>
      <ProfileInner />
    </ProtectedShell>
  );
}
