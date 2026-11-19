import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { COOKIE_NAME, clearedCookieOptions } from "../utils/cookies.js";
import { publicUser } from "../utils/sanitize.js";
import { profileUpdateSchema } from "../validators/index.js";

/** GET /profile — full profile of the logged-in user. */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { donorProfile: true, orgProfile: true },
  });
  res.json({ user: publicUser(user!) });
}

/** PUT /profile — edit basic profile details (role is NOT editable here). */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const data = profileUpdateSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: data.name,
      phone: data.phone,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    },
    include: { donorProfile: true, orgProfile: true },
  });
  res.json({ user: publicUser(updated) });
}

/** DELETE /profile — delete the account and everything owned by it (cascades). */
export async function deleteProfile(req: Request, res: Response): Promise<void> {
  await prisma.user.delete({ where: { id: req.user!.id } });
  res.cookie(COOKIE_NAME, "", clearedCookieOptions);
  res.json({ success: true });
}
