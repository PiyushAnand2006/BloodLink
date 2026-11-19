"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCamps, useRequests } from "@/hooks/useApiData";
import { useMe } from "@/hooks/useMe";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { HealthTips } from "@/components/home/HealthTips";
import { Card, CardBody } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Button";
import {
  BoxIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DropIcon,
  HospitalIcon,
  PersonIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 text-center">
      <h2 id={id} className="text-2xl font-semibold text-navy">
        {children}
      </h2>
      <span className="mx-auto mt-2 block h-1 w-14 rounded bg-primary" aria-hidden />
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    icon: <HospitalIcon className="h-7 w-7" />,
    title: "1. Hospital posts a request",
    text: "A verified hospital lists the blood group, component, units and how soon they are needed.",
  },
  {
    icon: <PersonIcon className="h-7 w-7" />,
    title: "2. Donors and NGOs respond",
    text: "Donors pledge with one tap; NGOs and blood banks respond with stock and camps. Phone numbers stay private until a pledge is made.",
  },
  {
    icon: <SearchIcon className="h-7 w-7" />,
    title: "3. Hospital confirms the donation",
    text: "The hospital contacts pledged donors, marks units DONATED, and closes the request when fulfilled.",
  },
];

const ROLE_FEATURES = [
  {
    icon: <PersonIcon className="h-7 w-7" />,
    title: "For donors",
    points: [
      "Availability toggle — be visible only when you can donate",
      "Automatic 90-day eligibility tracking with a next-eligible date",
      "One-tap pledges on emergency requests near you",
      "Rare blood groups are highlighted to hospitals",
    ],
    href: "/signup",
    cta: "Join as a donor",
  },
  {
    icon: <HospitalIcon className="h-7 w-7" />,
    title: "For hospitals",
    points: [
      "Post emergency requirements in seconds",
      "Responder console — phone numbers revealed after a pledge",
      "Search available, eligible donors by city and group",
      "Mark units DONATED and close requests when fulfilled",
    ],
    href: "/signup",
    cta: "Register your hospital",
  },
  {
    icon: <BoxIcon className="h-7 w-7" />,
    title: "For NGOs & blood banks",
    points: [
      "Publish live stock per blood group and component",
      "Organise donation camps and reach nearby donors",
      "Respond to hospital requests on behalf of your drive",
      "Stock changes appear on the dashboard within 20 seconds",
    ],
    href: "/signup",
    cta: "List your organisation",
  },
];

export default function LandingPage() {
  const { data: camps } = useCamps({});
  const { user, isValidating } = useMe();
  const router = useRouter();

  // Signed-in members go straight to the dashboard — the marketing home page
  // is only for guests (settled session check, never a stale-cache redirect).
  const signedIn = user !== null && user !== undefined;

  useEffect(() => {
    if (isValidating) return;
    if (signedIn) router.replace("/dashboard");
  }, [signedIn, isValidating, router]);

  if (signedIn) return <PageSpinner />;

  return (
    <div className="space-y-12 py-2">
      {/* Hero carousel — what the platform is */}
      <HeroCarousel />

      {/* How it works — crimson band */}
      <section
        aria-labelledby="how-it-works"
        className="relative rounded-lg bg-primary px-6 py-12 text-white"
      >
        <div className="text-center">
          <h2 id="how-it-works" className="text-2xl font-semibold text-white">
            How BloodLink works
          </h2>
          <DropIcon className="mx-auto mt-2 h-4 w-4 text-white/70" aria-hidden />
        </div>
        <div className="relative mx-auto mt-8 grid max-w-5xl gap-8 sm:grid-cols-3 sm:gap-6">
          <span
            aria-hidden
            className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-white/30 sm:block"
          />
          {HOW_IT_WORKS.map((step) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <span className="z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-pop">
                {step.icon}
              </span>
              <h3 className="mt-3 font-semibold text-white">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/80">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <HomeQuickLinks />

      {/* Features per role */}
      <section aria-labelledby="role-features">
        <SectionTitle id="role-features">Built for everyone in the chain</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          {ROLE_FEATURES.map((f) => (
            <Card key={f.title}>
              <CardBody className="flex h-full flex-col">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary">
                  {f.icon}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-navy">{f.title}</h3>
                <ul className="mt-3 flex-1 space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-ink">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={f.href}
                  className="mt-4 inline-block text-sm font-semibold text-info hover:underline"
                >
                  {f.cta} →
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust points */}
      <section aria-labelledby="trust-points">
        <SectionTitle id="trust-points">Why BloodLink</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <ClockIcon className="h-6 w-6" />,
              title: "Live in 20 seconds",
              text: "Availability, requests and camps refresh automatically — no stale phone calls.",
            },
            {
              icon: <ShieldCheckIcon className="h-6 w-6" />,
              title: "Private by design",
              text: "Phone numbers are never public — donors are reachable only by verified hospitals after a pledge.",
            },
            {
              icon: <DropIcon className="h-6 w-6" />,
              title: "Component aware",
              text: "Whole blood, platelets and plasma tracked separately, with transfusion-compatibility built in.",
            },
            {
              icon: <CalendarIcon className="h-6 w-6" />,
              title: "Camps included",
              text: "NGOs publish donation camps that appear right beside the availability data.",
            },
          ].map((t) => (
            <Card key={t.title}>
              <CardBody>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
                  {t.icon}
                </span>
                <h3 className="mt-3 font-semibold text-navy">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.text}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming camps teaser (public info) */}
      {(camps?.camps ?? []).length > 0 && (
        <section aria-labelledby="home-camps">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="home-camps" className="text-xl font-semibold text-navy">
              Upcoming donation camps
            </h2>
            <Link href="/camps" className="text-sm font-semibold text-info hover:underline">
              See all camps →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(camps?.camps ?? []).slice(0, 3).map((camp) => (
              <Card key={camp.id}>
                <CardBody>
                  <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-info">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {new Date(camp.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {camp.startTime}–{camp.endTime}
                  </p>
                  <p className="mt-1.5 font-semibold text-navy">{camp.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {camp.venue}, {camp.city}
                  </p>
                  {camp.org?.orgProfile?.orgName && (
                    <p className="mt-2 text-2xs text-muted">by {camp.org.orgProfile.orgName}</p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Health info */}
      <HealthTips />

      {/* CTA */}
      <section className="rounded-lg bg-navy px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-semibold">Ready to help save a life?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">
          Create a free account to pledge on emergencies, post requirements for your hospital, or
          publish stock and camps. The live dashboard unlocks the moment you sign in.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/signup">
            <span className="inline-flex items-center justify-center gap-2 rounded bg-white px-5 py-2.5 text-base font-semibold text-navy hover:bg-subtle">
              <DropIcon className="h-4 w-4 text-primary" />
              Create free account
            </span>
          </Link>
          <Link href="/login">
            <span className="inline-flex items-center justify-center rounded border border-white/40 px-5 py-2.5 text-base font-semibold text-white hover:bg-white/10">
              Sign in
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
