import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { ApiError } from "../middleware/errors.js";
import { verifyOrgSchema, userIdParamsSchema } from "../validators/index.js";

/**
 * PATCH /admin/orgs/:userId/verify — ADMIN only.
 * Flips the verification flag on an organisation profile (NGO / BLOOD_BANK /
 * HOSPITAL). Verified hospitals gain access to donor search.
 */
export async function verifyOrg(req: Request, res: Response): Promise<void> {
  const { userId } = userIdParamsSchema.parse(req.params);
  const { isVerified } = verifyOrgSchema.parse(req.body);

  const org = await prisma.orgProfile.findUnique({ where: { userId } });
  if (!org) {
    throw new ApiError(404, "No organisation profile found for this user");
  }

  const updated = await prisma.orgProfile.update({
    where: { userId },
    data: { isVerified },
  });
  res.json({ orgProfile: updated });
}
