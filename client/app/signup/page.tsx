"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { roleHome, ROLE_META, GENDERS, BLOOD_GROUPS, type Role } from "@/lib/constants";
import { useDistricts } from "@/hooks/useApiData";
import { useMe } from "@/hooks/useMe";
import { gsiClientId, renderGoogleButton } from "@/lib/googleAuth";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Logo } from "@/components/ui/Logo";
import { CheckCircleIcon, InfoIcon, ShieldCheckIcon } from "@/components/ui/icons";

const PENDING_CREDENTIAL_KEY = "bl.pendingGoogleCredential";

/* ------------------------------------------------------------------ */
/* Schema — mirrors the server's registration validation               */
/* ------------------------------------------------------------------ */

const buildSchema = (hasGoogle: boolean) =>
  z
    .object({
      role: z.enum(["DONOR", "NGO", "BLOOD_BANK", "HOSPITAL"]),
      // email/password identity — required unless the account is being
      // created via Google verification (identity comes from Google).
      name: hasGoogle ? z.string().optional() : z.string().trim().min(2, "Full name is required"),
      email: hasGoogle ? z.string().optional() : z.string().trim().email("Enter a valid email"),
      password: hasGoogle ? z.string().optional() : z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters"),
      confirmPassword: hasGoogle ? z.string().optional() : z.string(),
      phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
      city: z.string().trim().min(2, "City is required"),
      state: z.string().trim().min(2, "State is required"),
      pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode"),
      // donor fields
      bloodGroup: z.string().optional(),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      lastDonatedOn: z.string().optional(),
      // organisation fields
      orgName: z.string().optional(),
      regNo: z.string().optional(),
      address: z.string().optional(),
      contactPerson: z.string().optional(),
      districtId: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      if (!hasGoogle) {
        if (v.password !== v.confirmPassword) {
          issue("confirmPassword", "Passwords do not match");
        }
      }

      if (v.role === "DONOR") {
        if (!v.bloodGroup) issue("bloodGroup", "Blood group is required");
        if (!v.dateOfBirth) {
          issue("dateOfBirth", "Date of birth is required");
        } else {
          const dob = new Date(v.dateOfBirth);
          if (Number.isNaN(dob.getTime()) || dob.getTime() >= Date.now()) {
            issue("dateOfBirth", "Date of birth must be in the past");
          }
        }
        if (!v.gender) issue("gender", "Gender is required");
    } else {
      if (!v.orgName || v.orgName.trim().length < 2) issue("orgName", "Organisation name is required");
      if (!v.regNo || v.regNo.trim().length < 2) issue("regNo", "Registration number is required");
      if (!v.address || v.address.trim().length < 4) issue("address", "Address is required");
      if (!v.contactPerson || v.contactPerson.trim().length < 2)
        issue("contactPerson", "Contact person is required");
      if (!v.districtId) issue("districtId", "District is required");
    }
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const ROLE_OPTIONS: Array<{ value: FormValues["role"]; label: string }> = [
  { value: "DONOR", label: "Donor — I want to donate blood" },
  { value: "NGO", label: "NGO — we organise camps and list stock" },
  { value: "BLOOD_BANK", label: "Blood bank — we publish live stock" },
  { value: "HOSPITAL", label: "Hospital — we post emergency requests" },
];

function decodeJwtEmail(credential: string): string | null {
  try {
    const payload = JSON.parse(
      atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

function SignupInner() {
  const { user, isValidating, refresh } = useMe();
  const router = useRouter();
  const googleRef = useRef<HTMLDivElement>(null);
  const [credential, setCredential] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const googleConfigured = gsiClientId() !== null;
  const hasGoogle = credential !== null;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(useMemo(() => buildSchema(hasGoogle), [hasGoogle])),
    mode: "onTouched",
  });

  const role = watch("role");
  const { data: districtsData } = useDistricts();

  // Already signed in with a role → straight to the workspace.
  useEffect(() => {
    if (isValidating) return;
    if (user?.role) router.replace(roleHome(user.role));
  }, [user?.role, isValidating, router]);

  // A credential parked by the sign-in page ("no account found" flow).
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_CREDENTIAL_KEY);
    if (pending) setCredential(pending);
  }, []);

  // Render the Google verification button.
  useEffect(() => {
    if (!googleConfigured) return;
    let cancelled = false;
    renderGoogleButton(googleRef.current!, (c) => onGoogleCredential(c)).catch(() => {
      if (!cancelled) setError("Could not load Google sign-in. Check your connection.");
    });
    return () => {
      cancelled = true;
    };
  }, [googleConfigured]);

  const doRegister = async (values: FormValues, cred: string | null) => {
    setSubmitting(true);
    setError(null);
    setAccountExists(false);
    try {
      const {
        role: r,
        name,
        email,
        password,
        phone,
        city,
        state,
        pincode,
        ...rest
      } = values;
      const profile =
        r === "DONOR"
          ? {
              bloodGroup: rest.bloodGroup!,
              dateOfBirth: rest.dateOfBirth!,
              gender: rest.gender!,
              lastDonatedOn: rest.lastDonatedOn ? rest.lastDonatedOn : null,
            }
          : {
              orgName: rest.orgName!,
              regNo: rest.regNo!,
              address: rest.address!,
              contactPerson: rest.contactPerson!,
              districtId: rest.districtId!,
            };

      if (cred) {
        // Google-verified identity — name/email come from Google.
        await api("/auth/register", {
          method: "POST",
          body: { credential: cred, role: r, phone, city, state, pincode, ...profile },
        });
      } else {
        await api("/auth/register-email", {
          method: "POST",
          body: { name: name!.trim(), email: email!.trim().toLowerCase(), password: password!, role: r, phone, city, state, pincode, ...profile },
        });
      }
      sessionStorage.removeItem(PENDING_CREDENTIAL_KEY);
      await refresh();
      router.replace(roleHome(r));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
        setAccountExists(true);
        setError(e.message);
      } else if (e instanceof ApiError && e.status === 401) {
        setCredential(null);
        sessionStorage.removeItem(PENDING_CREDENTIAL_KEY);
        setError("Google verification expired — please verify with Google again.");
      } else {
        setError(e instanceof ApiError ? e.message : "Could not create the account");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleCredential = (c: string) => {
    setCredential(c);
    setError(null);
    // If the form is already valid, create the account right away.
    handleSubmit((values) => void doRegister(values, c))();
  };

  const onSubmit = handleSubmit((values) => void doRegister(values, credential));

  if (user !== null && user !== undefined && !isValidating) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-2xl py-4">
      <PageHeader
        title="Create your BloodLink account"
        subtitle="Pick your role, fill in the details, then finish with email + password or Google — your choice."
        actions={
          <Link href="/login" className="text-sm font-semibold text-info hover:underline">
            Already have an account? Sign in
          </Link>
        }
      />

      {error && (
        <div
          className={`mb-4 rounded border px-4 py-3 text-sm ${
            accountExists
              ? "border-[#F5E6B8] bg-[#FFF7E0] text-[#8a6d00]"
              : "border-danger/30 bg-primary-50 text-danger"
          }`}
          role="alert"
        >
          <p className="font-semibold">{error}</p>
          {accountExists && (
            <Link href="/login" className="mt-1 inline-block font-semibold text-info hover:underline">
              Go to sign in →
            </Link>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <div>
            <h2 className="font-semibold text-navy">Account details</h2>
            <p className="text-xs text-muted">Choose who you are — the required info changes accordingly.</p>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Field label="I am registering as" required htmlFor="su-role">
              <Select id="su-role" {...register("role")}>
                <option value="">Select role…</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>

            {/* Identity — replaced by the Google banner once verified */}
            {hasGoogle ? (
              <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-[#EAF5EB] px-4 py-3">
                <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <p className="text-sm text-navy">
                  <span className="font-semibold">Google account verified</span>
                  {decodeJwtEmail(credential!) ? <> — signing up as {decodeJwtEmail(credential!)}</> : null}
                  . Your name and email come from Google.
                </p>
              </div>
            ) : (
              <fieldset className="grid gap-4 sm:grid-cols-2" aria-label="Sign-in details">
                <legend className="mb-1 text-sm font-semibold text-navy">Sign-in details</legend>
                <Field label="Full name" error={errors.name} required htmlFor="su-name">
                  <Input id="su-name" autoComplete="name" {...register("name")} />
                </Field>
                <Field label="Email" error={errors.email} required htmlFor="su-email">
                  <Input id="su-email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
                </Field>
                <Field
                  label="Password"
                  error={errors.password}
                  required
                  htmlFor="su-password"
                  hint="At least 8 characters — used to sign in later"
                >
                  <Input id="su-password" type="password" autoComplete="new-password" {...register("password")} />
                </Field>
                <Field label="Confirm password" error={errors.confirmPassword} required htmlFor="su-confirm">
                  <Input id="su-confirm" type="password" autoComplete="new-password" {...register("confirmPassword")} />
                </Field>
              </fieldset>
            )}

            {role && (
              <>
                <fieldset className="grid gap-4 sm:grid-cols-2" aria-label="Contact details">
                  <legend className="mb-1 text-sm font-semibold text-navy">Contact details</legend>
                  <Field label="Mobile number" error={errors.phone} required htmlFor="su-phone">
                    <Input id="su-phone" inputMode="numeric" placeholder="9876543210" {...register("phone")} />
                  </Field>
                  <Field label="City" error={errors.city} required htmlFor="su-city">
                    <Input id="su-city" placeholder="Bengaluru" {...register("city")} />
                  </Field>
                  <Field label="State" error={errors.state} required htmlFor="su-state">
                    <Input id="su-state" placeholder="Karnataka" {...register("state")} />
                  </Field>
                  <Field label="Pincode" error={errors.pincode} required htmlFor="su-pincode">
                    <Input id="su-pincode" inputMode="numeric" placeholder="560001" {...register("pincode")} />
                  </Field>
                </fieldset>

                {role === "DONOR" ? (
                  <fieldset className="grid gap-4 sm:grid-cols-2" aria-label="Donor profile">
                    <legend className="mb-1 text-sm font-semibold text-navy">Donor profile</legend>
                    <Field label="Blood group" error={errors.bloodGroup} required htmlFor="su-bg">
                      <Select id="su-bg" {...register("bloodGroup")}>
                        <option value="">Select…</option>
                        {BLOOD_GROUPS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Gender" error={errors.gender} required htmlFor="su-gender">
                      <Select id="su-gender" {...register("gender")}>
                        <option value="">Select…</option>
                        {GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Date of birth" error={errors.dateOfBirth} required htmlFor="su-dob">
                      <Input id="su-dob" type="date" {...register("dateOfBirth")} />
                    </Field>
                    <Field
                      label="Last donated on (optional)"
                      hint="Used to compute your 90-day eligibility"
                      error={errors.lastDonatedOn}
                      htmlFor="su-last"
                    >
                      <Input id="su-last" type="date" {...register("lastDonatedOn")} />
                    </Field>
                  </fieldset>
                ) : (
                  <fieldset className="grid gap-4 sm:grid-cols-2" aria-label="Organisation profile">
                    <legend className="mb-1 text-sm font-semibold text-navy">
                      {ROLE_META[role as Role].label} profile
                    </legend>
                    <Field label="Organisation name" error={errors.orgName} required htmlFor="su-orgName">
                      <Input id="su-orgName" {...register("orgName")} />
                    </Field>
                    <Field label="Registration number" error={errors.regNo} required htmlFor="su-regNo">
                      <Input id="su-regNo" {...register("regNo")} />
                    </Field>
                    <Field label="Address" error={errors.address} required htmlFor="su-address">
                      <Input id="su-address" {...register("address")} />
                    </Field>
                    <Field label="Contact person" error={errors.contactPerson} required htmlFor="su-contact">
                      <Input id="su-contact" {...register("contactPerson")} />
                    </Field>
                    <Field
                      label="District"
                      error={errors.districtId}
                      required
                      htmlFor="su-district"
                      hint="Karnataka's 31 districts — shown on your public listings"
                    >
                      <Select id="su-district" {...register("districtId")}>
                        <option value="">Select district…</option>
                        {(districtsData?.districts ?? []).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </fieldset>
                )}
              </>
            )}

            {/* Finish: email+password OR Google */}
            <div className="rounded-lg border border-line bg-subtle p-4">
              {hasGoogle ? (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <ShieldCheckIcon className="h-4 w-4 text-success" />
                    Finish creating your account
                  </p>
                  <Button type="submit" loading={submitting}>
                    Create account with Google
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <ShieldCheckIcon className="h-4 w-4 text-success" />
                    Finish with email &amp; password
                  </p>
                  <Button type="submit" className="w-full" loading={submitting}>
                    Create account
                  </Button>
                  <div className="flex items-center gap-3 text-2xs uppercase tracking-widest text-muted">
                    <span className="h-px flex-1 bg-line" />
                    or continue with Google
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  {googleConfigured ? (
                    <>
                      <div className="flex justify-center">
                        <div ref={googleRef} />
                      </div>
                      <p className="flex items-start gap-2 text-xs text-muted">
                        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        With Google, your name and email come from your Google account and no
                        password is needed.
                      </p>
                    </>
                  ) : (
                    <p className="flex items-start gap-2 text-xs text-[#8a6d00]">
                      <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Google sign-up is not configured on this deployment — use email and password.
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-xs text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-info hover:underline">
          Sign in
        </Link>
        {" · "}
        <Link href="/dashboard" className="font-semibold text-info hover:underline">
          Just browsing? Explore the dashboard without an account
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return <SignupInner />;
}
