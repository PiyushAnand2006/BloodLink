import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { eligibleFrom, isEligible } from "../utils/blood.js";
import { ApiError } from "../middleware/errors.js";
import { availabilitySchema, donorUpdateSchema } from "../validators/index.js";

export interface DonorMeResponse {
  profile: {
    userId: string;
    bloodGroup: string;
    dateOfBirth: Date;
    gender: string;
    isAvailable: boolean;
    isRare: boolean;
    lastDonatedOn: Date | null;
    eligible: boolean;
    eligibleFrom: Date | null;
  };
}

/** GET /donor/me — own donor profile + computed eligibility. */
export async function getDonorMe(req: Request, res: Response): Promise<void> {
  const profile = await prisma.donorProfile.findUnique({
    where: { userId: req.user!.id },
  });
  if (!profile) {
    throw new ApiError(404, "Donor profile not found");
  }
  const body: DonorMeResponse = {
    profile: {
      ...profile,
      eligible: isEligible(profile.lastDonatedOn),
      // Only surfaced when the donor is NOT currently eligible ("Eligible from <date>").
      eligibleFrom: isEligible(profile.lastDonatedOn) ? null : eligibleFrom(profile.lastDonatedOn),
    },
  };
  res.json(body);
}

/** PUT /donor/me — update donor profile fields. */
export async function updateDonorMe(req: Request, res: Response): Promise<void> {
  const data = donorUpdateSchema.parse(req.body);
  const existing = await prisma.donorProfile.findUnique({
    where: { userId: req.user!.id },
  });
  if (!existing) {
    throw new ApiError(404, "Donor profile not found");
  }
  const updated = await prisma.donorProfile.update({
    where: { userId: req.user!.id },
    data: {
      bloodGroup: data.bloodGroup,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      isRare: data.isRare ?? existing.isRare,
      isAvailable: data.isAvailable ?? existing.isAvailable,
      lastDonatedOn: data.lastDonatedOn === undefined ? existing.lastDonatedOn : data.lastDonatedOn,
    },
  });
  const eligible = isEligible(updated.lastDonatedOn);
  res.json({
    profile: {
      ...updated,
      eligible,
      eligibleFrom: eligible ? null : eligibleFrom(updated.lastDonatedOn),
    },
  });
}

/** PATCH /donor/me/availability — quick toggle. */
export async function updateAvailability(req: Request, res: Response): Promise<void> {
  const { isAvailable } = availabilitySchema.parse(req.body);
  const existing = await prisma.donorProfile.findUnique({
    where: { userId: req.user!.id },
  });
  if (!existing) {
    throw new ApiError(404, "Donor profile not found");
  }
  const updated = await prisma.donorProfile.update({
    where: { userId: req.user!.id },
    data: { isAvailable },
  });
  const eligible = isEligible(updated.lastDonatedOn);
  res.json({
    profile: {
      ...updated,
      eligible,
      eligibleFrom: eligible ? null : eligibleFrom(updated.lastDonatedOn),
    },
  });
}
