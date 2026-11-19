"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DropIcon } from "@/components/ui/icons";

const SLIDES = [
  {
    title: "Voluntary blood donation is a noble deed",
    text: "One donation can save up to three lives. Pledge today — a hospital near you may be waiting for exactly your blood group.",
    cta: { label: "Donate blood", href: "/signup" },
  },
  {
    title: "Need blood urgently?",
    text: "Check live availability by city and component — donors, NGOs and blood banks, refreshed every 20 seconds.",
    cta: { label: "Check availability", href: "/dashboard" },
  },
  {
    title: "Organising a donation camp?",
    text: "NGOs publish camps and blood banks list live stock — every hospital sees them instantly on the dashboard.",
    cta: { label: "See upcoming camps", href: "/camps" },
  },
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

/** Auto-rotating red banner strip (portal-style hero). */
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
      className="relative overflow-hidden rounded-lg bg-primary text-white shadow-card"
    >
      <DropIcon className="pointer-events-none absolute -right-10 -top-12 h-72 w-72 text-white/10" aria-hidden />
      <DropIcon className="pointer-events-none absolute -bottom-20 right-52 h-44 w-44 text-white/5" aria-hidden />

      <div className="relative px-8 py-10 sm:px-12 sm:py-12">
        <p className="text-2xs font-bold uppercase tracking-widest text-white/80">
          {index + 1} / {SLIDES.length}
        </p>
        <h2 key={index} className="animate-fadein max-w-2xl text-2xl font-bold leading-tight !text-white sm:text-3xl">
          {slide.title}
        </h2>
        <p className="animate-fadein mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          {slide.text}
        </p>
        <Link href={slide.cta.href} className="mt-6 inline-block">
          <Button size="lg" className="!bg-white !text-navy hover:!bg-subtle">
            {slide.cta.label}
          </Button>
        </Link>

        {/* Prev / next */}
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous banner"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next banner"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <Chevron direction="right" />
          </button>
        </div>

        {/* Dots */}
        <div className="mt-6 flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Go to banner ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
