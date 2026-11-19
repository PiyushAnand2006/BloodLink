import type { BloodGroup } from "./constants";

/**
 * Blood compatibility display map (who can donate whole blood TO the key).
 * Non-whole-blood components use exact group match.
 */
export const WHOLE_BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  O_NEG: ["O_NEG"],
  O_POS: ["O_POS", "O_NEG"],
  A_NEG: ["A_NEG", "O_NEG"],
  A_POS: ["A_POS", "A_NEG", "O_POS", "O_NEG"],
  B_NEG: ["B_NEG", "O_NEG"],
  B_POS: ["B_POS", "B_NEG", "O_POS", "O_NEG"],
  AB_NEG: ["AB_NEG", "A_NEG", "B_NEG", "O_NEG"],
  AB_POS: ["AB_POS", "AB_NEG", "A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG"],
};

export const DONATION_GAP_DAYS = 90;

/* ------------------------------ formatting ------------------------------ */

export function fmtDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${fmtDate(d)}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export function fmtTimeAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export interface CountdownInfo {
  text: string;
  expired: boolean;
  criticalSoon: boolean; // < 12h remaining
}

export function countdown(neededBy: string | Date, now: number): CountdownInfo {
  const target = (typeof neededBy === "string" ? new Date(neededBy) : neededBy).getTime();
  const diff = target - now;
  if (diff <= 0) return { text: "Overdue", expired: true, criticalSoon: true };
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  let text: string;
  if (days > 0) text = `in ${days}d ${hours}h`;
  else if (hours > 0) text = `in ${hours}h ${minutes}m`;
  else text = `in ${minutes}m`;
  return { text, expired: false, criticalSoon: totalMinutes < 720 };
}

export function ageFrom(dob: string | Date): number {
  const d = typeof dob === "string" ? new Date(dob) : dob;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const beforeBirthday =
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Date input value (yyyy-mm-dd) for a Date. */
export function dateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** datetime-local input value for a Date, in local time. */
export function dateTimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Mirror of the server eligibility rule for display. */
export function isEligible(lastDonatedOn: string | null): boolean {
  if (!lastDonatedOn) return true;
  return new Date(lastDonatedOn).getTime() <= Date.now() - DONATION_GAP_DAYS * 24 * 60 * 60 * 1000;
}

/** "Eligible from <date>" — the 90th day after the last donation. */
export function eligibleFrom(lastDonatedOn: string | null): Date | null {
  if (!lastDonatedOn) return null;
  const d = new Date(lastDonatedOn);
  d.setDate(d.getDate() + DONATION_GAP_DAYS);
  return d;
}
