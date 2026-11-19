"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ClockIcon, DropIcon, RefreshIcon, ShieldCheckIcon } from "@/components/ui/icons";

const SLIDES = [
  {
    badge: "Become a donor",
    titleTop: "Voluntary donation —",
    titleAccent: "one gift, three lives.",
    text: "One unit can be split into red cells, platelets and plasma. Pledge today — a hospital near you may be waiting for exactly your blood group.",
    cta: { label: "Donate blood", href: "/signup" },
    photo: "/hero/donor-unsplash-2rNHliX6XHk.jpg",
    photoAlt: "Nurse in white gloves inserting a needle into a donor's arm at a donation clinic",
  },
  {
    badge: "Emergency requests",
    titleTop: "Need blood",
    titleAccent: "urgently?",
    text: "Check live availability by city and component — donors, NGOs and blood banks, refreshed every 20 seconds.",
    cta: { label: "Check availability", href: "/dashboard" },
    photo: "/hero/bags-pexels-4531307.jpg",
    photoAlt: "A, B and O blood group bags lying on a white background",
  },
  {
    badge: "Camps & live stock",
    titleTop: "Organising",
    titleAccent: "a donation camp?",
    text: "NGOs publish camps and blood banks list live stock — every hospital sees them instantly on the dashboard.",
    cta: { label: "See upcoming camps", href: "/camps" },
    photo: "/hero/camp-pexels-37191912.jpg",
    photoAlt: "Health workers registering donors at an outdoor blood donation camp",
  },
];

const TRUST_CHIPS = [
  { icon: <ShieldCheckIcon className="h-4 w-4" />, label: "Secure & verified" },
  { icon: <RefreshIcon className="h-4 w-4" />, label: "Live in 20 seconds" },
  { icon: <ClockIcon className="h-4 w-4" />, label: "90-day eligibility tracking" },
];

const WATERMARK_GROUPS = [
  { label: "A+", className: "left-4 top-10 text-6xl" },
  { label: "B+", className: "right-1/3 top-6 text-5xl" },
  { label: "O−", className: "left-1/3 bottom-8 text-5xl" },
  { label: "AB+", className: "right-6 bottom-16 text-6xl" },
];

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      {direction === "left" ? <path d="m15 6-6 6 6 6" /> : <path d="m9 6 6 6-6 6" />}
    </svg>
  );
}

/**
 * Landing hero — soft pink gradient, rotating headline on the left and a real
 * photograph on the right that swaps with the active slide.
 * Photos: Unsplash (Nguyễn Hiệp), Pexels (Charlie Helene Robinson, Himanuuu) —
 * free for commercial use, no attribution required.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next]);

  const slide = SLIDES[index];

  return (
    <section
      aria-label="Highlights"
      className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary-50 via-white to-primary-100 shadow-card"
    >
      {/* Faint blood-group watermarks */}
      {WATERMARK_GROUPS.map((g) => (
        <span
          key={g.label}
          aria-hidden
          className={`pointer-events-none absolute hidden font-black text-primary/10 lg:block ${g.className}`}
        >
          {g.label}
        </span>
      ))}
      <DropIcon
        className="pointer-events-none absolute -left-10 -bottom-14 h-56 w-56 text-primary/5"
        aria-hidden
      />

      <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-2 lg:gap-2 lg:py-12">
        {/* Copy */}
        <div>
          <p
            key={`badge-${index}`}
            className="animate-fadein inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-2xs font-bold uppercase tracking-widest text-primary shadow-card"
          >
            <DropIcon className="h-3.5 w-3.5" />
            {slide.badge}
          </p>
          <h2
            key={`title-${index}`}
            className="animate-fadein mt-4 text-3xl font-extrabold leading-tight text-navy sm:text-4xl"
          >
            {slide.titleTop} <span className="text-primary">{slide.titleAccent}</span>
          </h2>
          <p
            key={`text-${index}`}
            className="animate-fadein mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base"
          >
            {slide.text}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={slide.cta.href}>
              <Button size="lg">
                {slide.cta.label} <span aria-hidden>→</span>
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button size="lg" variant="secondary">
                How it works <span aria-hidden>→</span>
              </Button>
            </Link>
          </div>

          {/* Trust chips */}
          <ul className="mt-7 flex flex-wrap gap-3">
            {TRUST_CHIPS.map((chip) => (
              <li
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-navy shadow-card"
              >
                <span className="text-primary">{chip.icon}</span>
                {chip.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Real photograph — swaps with the active slide */}
        <div className="relative hidden items-center justify-center sm:flex">
          <span
            aria-hidden
            className="absolute -bottom-3 left-5 h-full w-full rounded-lg bg-primary-100"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`photo-${index}`}
            src={slide.photo}
            alt={slide.photoAlt}
            className="animate-fadein relative z-10 aspect-[4/3] w-full max-w-lg rounded-lg object-cover shadow-pop"
            loading="eager"
          />
        </div>
      </div>

      {/* Prev / next */}
      <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous highlight"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-navy shadow-card hover:bg-white"
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next highlight"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-navy shadow-card hover:bg-white"
        >
          <Chevron direction="right" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 left-6 flex items-center gap-2 sm:left-10">
        {SLIDES.map((s, i) => (
          <button
            key={s.badge}
            type="button"
            aria-label={`Go to highlight ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-primary" : "w-2 bg-primary/25 hover:bg-primary/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
