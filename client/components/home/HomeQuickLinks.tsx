"use client";

import Link from "next/link";
import { CalendarIcon, DropIcon, HospitalIcon, SearchIcon } from "@/components/ui/icons";

const LINKS = [
  {
    href: "/dashboard",
    icon: <SearchIcon className="h-7 w-7" />,
    title: "Looking for blood?",
    text: "Sign in to check live availability by city and blood group — updated every 20 seconds.",
  },
  {
    href: "/requests",
    icon: <DropIcon className="h-7 w-7" />,
    title: "Want to donate?",
    text: "See emergency requirements and pledge with one click if you are eligible.",
  },
  {
    href: "/camps",
    icon: <CalendarIcon className="h-7 w-7" />,
    title: "Donation camps",
    text: "Upcoming camps organised by NGOs — walk in, donate, get screened.",
  },
  {
    href: "/signup",
    icon: <HospitalIcon className="h-7 w-7" />,
    title: "For organisations",
    text: "Register your hospital, NGO or blood bank in under two minutes.",
  },
];

/** Portal-style quick-links tiles. */
export function HomeQuickLinks() {
  return (
    <section aria-label="Quick links">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-lg border border-line bg-surface p-4 shadow-card transition-colors hover:border-primary/50 hover:shadow-pop"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
              {l.icon}
            </span>
            <p className="mt-3 font-semibold text-navy">{l.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{l.text}</p>
            <p className="mt-2 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
