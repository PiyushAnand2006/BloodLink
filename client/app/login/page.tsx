"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { roleHome, type ApiUser } from "@/lib/constants";
import { useMe } from "@/hooks/useMe";
import { gsiClientId, renderGoogleButton } from "@/lib/googleAuth";
import { Button, PageSpinner } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/forms";
import { Logo } from "@/components/ui/Logo";
import { AlertTriangleIcon, InfoIcon } from "@/components/ui/icons";

const PENDING_CREDENTIAL_KEY = "bl.pendingGoogleCredential";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

function LoginInner() {
  const { user, isValidating, refresh } = useMe();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const googleRef = useRef<HTMLDivElement>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false); // 404 → invite to /signup
  const [useGoogle, setUseGoogle] = useState(false); // 409 → account is Google-only
  const [submitting, setSubmitting] = useState(false);

  const googleConfigured = gsiClientId() !== null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  // Redirect users who are already signed in — but only once the session
  // check has settled (never act on a stale SWR cache mid-logout).
  useEffect(() => {
    if (isValidating) return;
    if (user?.role) router.replace(next || roleHome(user.role));
  }, [user?.role, isValidating, next, router]);

  // Render the Google button when a client ID is configured.
  useEffect(() => {
    if (!googleConfigured) return;
    let cancelled = false;
    renderGoogleButton(googleRef.current!, async (credential) => {
      setError(null);
      setNoAccount(false);
      setUseGoogle(false);
      try {
        await api<{ user: ApiUser }>("/auth/google", { method: "POST", body: { credential } });
        await refresh();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          // Verified with Google but not registered → park the credential so the
          // sign-up page can finish creation without a second Google popup.
          sessionStorage.setItem(PENDING_CREDENTIAL_KEY, credential);
          setNoAccount(true);
        } else {
          setError(e instanceof ApiError ? e.message : "Google sign-in failed");
        }
      }
    }).catch(() => {
      if (!cancelled) setGoogleError("Could not load Google sign-in. Check your connection.");
    });
    return () => {
      cancelled = true;
    };
  }, [googleConfigured, refresh]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setNoAccount(false);
    setUseGoogle(false);
    setSubmitting(true);
    try {
      await api<{ user: ApiUser }>("/auth/login", {
        method: "POST",
        body: { email: values.email.trim().toLowerCase(), password: values.password },
      });
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError("No account exists with this email. Please create an account first.");
        setNoAccount(true);
      } else if (e instanceof ApiError && e.status === 409) {
        setUseGoogle(true);
        setError(e.message);
      } else {
        setError(e instanceof ApiError ? e.message : "Sign-in failed");
      }
    } finally {
      setSubmitting(false);
    }
  });

  if (user !== null && user !== undefined && !isValidating) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-md py-6">
      <Card>
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <Logo className="h-14 w-14" />
          <div>
            <h1 className="text-xl font-semibold text-navy">Sign in to BloodLink</h1>
            <p className="mt-1 text-sm text-muted">
              Email and password, or the Google account you registered with.
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          {noAccount && (
            <div
              className="flex items-start gap-3 rounded-lg border border-[#F5E6B8] bg-[#FFF7E0] px-4 py-3"
              role="alert"
            >
              <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6d00]" />
              <div className="text-sm text-[#8a6d00]">
                <p className="font-semibold">No account exists with this email yet.</p>
                <Link href="/signup" className="mt-1 inline-block">
                  <Button size="sm">Create an account →</Button>
                </Link>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm font-semibold text-danger" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Email" error={errors.email} required htmlFor="login-email">
              <Input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
            </Field>
            <Field label="Password" error={errors.password} required htmlFor="login-password">
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                {...register("password")}
              />
            </Field>
            <Button type="submit" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>

          {googleConfigured && (
            <>
              <div className="flex items-center gap-3 text-2xs uppercase tracking-widest text-muted">
                <span className="h-px flex-1 bg-line" />
                or continue with Google
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="flex justify-center">
                <div ref={googleRef} />
              </div>
            </>
          )}
          {!googleConfigured && (
            <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-[#E8F1FC] px-4 py-3 text-sm text-navy">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <p>
                <span className="font-semibold">Google sign-in not configured</span> on this
                deployment — use email and password. (Set{" "}
                <code className="rounded bg-white px-1 text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
                to enable it.)
              </p>
            </div>
          )}
          {googleError && <p className="text-sm font-semibold text-danger">{googleError}</p>}

          <p className="text-center text-xs text-muted">
            New to BloodLink?{" "}
            <Link href="/signup" className="font-semibold text-info hover:underline">
              Create an account
            </Link>
          </p>
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-sm">
        <Link href="/dashboard" className="font-semibold text-info hover:underline">
          Just browsing? Explore the live dashboard without an account →
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    // Suspense boundary required by Next prerendering for useSearchParams.
    <Suspense fallback={<PageSpinner />}>
      <LoginInner />
    </Suspense>
  );
}
