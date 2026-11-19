"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { ROLE_META, type Role } from "@/lib/constants";
import { useMe } from "@/hooks/useMe";
import { Logo, Wordmark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import {
  CalendarIcon,
  ClockIcon,
  DropIcon,
  LogoutIcon,
  PersonIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";

/* ------------------------------------------------------------------ */
/* Top utility strip (navy) + text-size accessibility control          */
/* ------------------------------------------------------------------ */

type FontScale = "sm" | "md" | "lg";
const FONT_SIZES: Record<FontScale, string> = { sm: "14px", md: "16px", lg: "18px" };

export function UtilityBar() {
  const [scale, setScale] = useState<FontScale>("md");

  useEffect(() => {
    const saved = window.localStorage.getItem("bl.fontScale");
    if (saved === "sm" || saved === "md" || saved === "lg") setScale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[scale];
    window.localStorage.setItem("bl.fontScale", scale);
  }, [scale]);

  return (
    <div className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5 text-2xs">
        <p className="font-medium">BloodLink — a coordination platform for blood emergencies</p>
        <div className="hidden items-center gap-4 sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="text-white/70">Text size</span>
            {(["sm", "md", "lg"] as FontScale[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={scale === s}
                aria-label={`Text size ${s === "sm" ? "small" : s === "md" ? "normal" : "large"}`}
                onClick={() => setScale(s)}
                className={`rounded px-1.5 py-0.5 font-bold leading-none transition-colors ${
                  scale === s ? "bg-white text-navy" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {s === "sm" ? "A-" : s === "md" ? "A" : "A+"}
              </button>
            ))}
          </div>
          <span className="hidden items-center gap-1 font-semibold md:flex">
            <ClockIcon className="h-3 w-3" />
            Medical emergency? Call <span className="rounded bg-white/15 px-1.5 py-0.5">108</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header (white) — logo + auth area only; nav lives in MainNav        */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

function navFor(role: Role | null): NavItem[] {
  const items: NavItem[] = [
    { href: "/dashboard", label: "Live Dashboard", icon: <DropIcon className="h-4 w-4" /> },
    { href: "/requests", label: "Emergency Requests", icon: <SearchIcon className="h-4 w-4" /> },
    { href: "/camps", label: "Donation Camps", icon: <CalendarIcon className="h-4 w-4" /> },
  ];
  if (role === "DONOR") {
    items.push({ href: "/donor", label: "My availability", icon: <PersonIcon className="h-4 w-4" /> });
    items.push({ href: "/my-responses", label: "My responses", icon: <ClockIcon className="h-4 w-4" /> });
  }
  if (role === "HOSPITAL") {
    items.push({ href: "/hospital/requests", label: "My requests", icon: <PersonIcon className="h-4 w-4" /> });
    items.push({ href: "/hospital/donors", label: "Find donors", icon: <SearchIcon className="h-4 w-4" /> });
  }
  if (role === "NGO" || role === "BLOOD_BANK") {
    items.push({ href: "/org/stock", label: "Stock", icon: <DropIcon className="h-4 w-4" /> });
    if (role === "NGO") {
      items.push({ href: "/org/camps", label: "My camps", icon: <CalendarIcon className="h-4 w-4" /> });
    }
  }
  return items;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader() {
  const { user } = useMe();
  const router = useRouter();

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/");
    router.refresh();
  };

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label="BloodLink home">
          <Logo className="h-10 w-10" />
          <Wordmark />
        </Link>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-subtle"
                aria-label="Profile"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-line" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-2xs font-bold text-white">
                    {initials(user.name)}
                  </span>
                )}
                <span className="text-left">
                  <span className="block max-w-[160px] truncate text-sm font-semibold text-navy">
                    {user.name}
                  </span>
                  <span className="block text-2xs text-muted">
                    {user.role ? ROLE_META[user.role].label : "—"}
                  </span>
                </span>
              </Link>
              <Button variant="secondary" size="sm" onClick={logout} aria-label="Log out">
                <LogoutIcon className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Create account</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: compact sign-in / profile chip */}
        <div className="ml-auto lg:hidden">
          {user ? (
            <Link href="/profile" aria-label="Profile" className="flex items-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-2xs font-bold text-white">
                {initials(user.name)}
              </span>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Main navigation strip (maroon, government-portal style)             */
/* ------------------------------------------------------------------ */

export function MainNav() {
  const { user } = useMe();
  const pathname = usePathname();
  const role = user?.role ?? null;
  const items: NavItem[] = [{ href: "/", label: "Home", icon: <DropIcon className="h-4 w-4" /> }, ...navFor(role)];

  return (
    <nav className="hidden bg-maroon lg:block" aria-label="Primary">
      <div className="mx-auto flex max-w-6xl items-center px-4">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon-900 ${
                active ? "bg-maroon-900" : ""
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
        <span className="ml-auto hidden items-center gap-1 text-2xs font-semibold text-white/80 xl:flex">
          <ClockIcon className="h-3 w-3" />
          Every pledge is screened by the receiving hospital or blood bank
        </span>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Footer (maroon)                                                     */
/* ------------------------------------------------------------------ */

export function AppFooter() {
  return (
    <footer className="mt-12 bg-maroon text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold">BloodLink</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            Connecting hospitals with donors, NGOs and blood banks when stock runs out.
          </p>
        </div>
        <div>
          <p className="text-2xs font-bold uppercase tracking-widest text-white/70">Platform</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:underline" href="/dashboard">Live dashboard</Link></li>
            <li><Link className="hover:underline" href="/requests">Emergency requests</Link></li>
            <li><Link className="hover:underline" href="/camps">Donation camps</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-2xs font-bold uppercase tracking-widest text-white/70">Reference</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Emergency number: 108</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-4 text-2xs leading-relaxed text-white/80">
          <span className="mt-0.5 shrink-0 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 font-semibold uppercase tracking-wide text-white">
            Disclaimer
          </span>
          <p>
            BloodLink is a coordination platform. Donors must be screened by a hospital or blood
            bank. Availability shown here is indicative and must be confirmed with the concerned
            blood bank before transfusion decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile bottom nav                                                   */
/* ------------------------------------------------------------------ */

export function BottomNav() {
  const pathname = usePathname();
  const items: NavItem[] = [
    { href: "/", label: "Home", icon: <DropIcon className="h-5 w-5" /> },
    { href: "/dashboard", label: "Dashboard", icon: <DropIcon className="h-5 w-5" /> },
    { href: "/requests", label: "Requests", icon: <SearchIcon className="h-5 w-5" /> },
    { href: "/camps", label: "Camps", icon: <CalendarIcon className="h-5 w-5" /> },
    { href: "/profile", label: "Profile", icon: <UserIcon className="h-5 w-5" /> },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      aria-label="Primary mobile"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-2xs font-semibold ${
                  active ? "text-primary" : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Convenience wrapper used by the root layout. */
export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <UtilityBar />
      <AppHeader />
      <MainNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 lg:pb-6">{children}</main>
      <AppFooter />
      <BottomNav />
    </div>
  );
}
