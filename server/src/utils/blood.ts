import { BloodGroup, Component } from "@prisma/client";

/**
 * Compatibility map for WHOLE_BLOOD requests (who can donate TO whom).
 * Key = the patient's/request's blood group; value = donor groups that can
 * safely donate whole blood to it.
 *
 * Other components (platelets / plasma) use exact blood group match.
 */
export const WHOLE_BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  O_NEG: [BloodGroup.O_NEG],
  O_POS: [BloodGroup.O_POS, BloodGroup.O_NEG],
  A_NEG: [BloodGroup.A_NEG, BloodGroup.O_NEG],
  A_POS: [BloodGroup.A_POS, BloodGroup.A_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  B_NEG: [BloodGroup.B_NEG, BloodGroup.O_NEG],
  B_POS: [BloodGroup.B_POS, BloodGroup.B_NEG, BloodGroup.O_POS, BloodGroup.O_NEG],
  AB_NEG: [BloodGroup.AB_NEG, BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.O_NEG],
  AB_POS: [
    BloodGroup.AB_POS,
    BloodGroup.AB_NEG,
    BloodGroup.A_POS,
    BloodGroup.A_NEG,
    BloodGroup.B_POS,
    BloodGroup.B_NEG,
    BloodGroup.O_POS,
    BloodGroup.O_NEG,
  ],
};

export function compatibleDonorGroups(
  requestGroup: BloodGroup,
  component: Component,
): BloodGroup[] {
  if (component === Component.WHOLE_BLOOD) {
    return WHOLE_BLOOD_COMPATIBILITY[requestGroup];
  }
  return [requestGroup];
}

/** A donor who donated on `lastDonatedOn` is eligible again after 90 days. */
export const DONATION_GAP_DAYS = 90;

export function eligibilityCutoff(now = new Date()): Date {
  return new Date(now.getTime() - DONATION_GAP_DAYS * 24 * 60 * 60 * 1000);
}

export function isEligible(lastDonatedOn: Date | null, now = new Date()): boolean {
  if (!lastDonatedOn) return true;
  return lastDonatedOn.getTime() <= eligibilityCutoff(now).getTime();
}

/** Date from which a donor becomes eligible again (null if already eligible / never donated). */
export function eligibleFrom(lastDonatedOn: Date | null): Date | null {
  if (!lastDonatedOn) return null;
  const from = new Date(lastDonatedOn.getTime());
  from.setDate(from.getDate() + DONATION_GAP_DAYS);
  return from;
}

/**
 * Availability level for a dashboard tile, computed from supply only
 * (donors + units). Demand (open requests) is displayed separately —
 * demand must never make supply look "plentiful".
 *   RED   = 0 total supply
 *   AMBER = 1–4 total supply
 *   GREEN = 5+ total supply
 */
export type StockLevel = "RED" | "AMBER" | "GREEN";

export function supplyLevel(donorsAvailable: number, unitsAvailable: number): StockLevel {
  const total = donorsAvailable + unitsAvailable;
  if (total === 0) return "RED";
  if (total <= 4) return "AMBER";
  return "GREEN";
}

/** Fixed display order for the 8 dashboard tiles. */
export const BLOOD_GROUP_ORDER: BloodGroup[] = [
  BloodGroup.A_POS,
  BloodGroup.A_NEG,
  BloodGroup.B_POS,
  BloodGroup.B_NEG,
  BloodGroup.AB_POS,
  BloodGroup.AB_NEG,
  BloodGroup.O_POS,
  BloodGroup.O_NEG,
];
