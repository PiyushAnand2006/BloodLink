import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { ApiError } from "../middleware/errors.js";
import { eligibilityCutoff, eligibleFrom } from "../utils/blood.js";
import { parseQuery, donorsQuerySchema } from "../validators/query.js";

/**
 * GET /donors?bloodGroup=&city=&pincode=&rareOnly=true
 * Verified hospitals only. PRIVACY: this is the only place donor phone
 * numbers are exposed, and only to verified hospital accounts.
 * Only available AND currently-eligible donors are returned — there is no
 * point listing donors who cannot donate today.
 */
export async function searchDonors(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  if (user.role !== Role.HOSPITAL) {
    throw new ApiError(403, "Only hospital accounts can search donors");
  }
  const org = await prisma.orgProfile.findUnique({ where: { userId: user.id } });
  if (!org?.isVerified) {
    throw new ApiError(403, "Your hospital account must be verified before searching donors");
  }

  const q = parseQuery(donorsQuerySchema, req.query);

  const donors = await prisma.donorProfile.findMany({
    where: {
      isAvailable: true,
      ...(q.bloodGroup ? { bloodGroup: q.bloodGroup } : {}),
      ...(q.rareOnly === "true" ? { isRare: true } : {}),
      ...(q.city ? { user: { city: { equals: q.city, mode: "insensitive" } } } : {}),
      ...(q.pincode ? { user: { pincode: q.pincode } } : {}),
      user: { role: Role.DONOR },
      OR: [{ lastDonatedOn: null }, { lastDonatedOn: { lte: eligibilityCutoff() } }],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
          state: true,
          pincode: true,
        },
      },
    },
    orderBy: [{ isRare: "desc" }, { user: { name: "asc" } }],
    take: 100,
  });

  res.json({
    donors: donors.map((d) => ({
      id: d.userId,
      name: d.user.name,
      phone: d.user.phone,
      city: d.user.city,
      state: d.user.state,
      pincode: d.user.pincode,
      bloodGroup: d.bloodGroup,
      gender: d.gender,
      age: ageFrom(d.dateOfBirth),
      isRare: d.isRare,
      lastDonatedOn: d.lastDonatedOn,
      eligibleFrom: eligibleFrom(d.lastDonatedOn),
    })),
  });
}

function ageFrom(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const beforeBirthday =
    now.getMonth() < dateOfBirth.getMonth() ||
    (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
