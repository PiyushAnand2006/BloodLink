import { Router } from "express";
import { requireAuth, requireRole, validateBody } from "../middleware/auth.js";
import { getDonorMe, updateAvailability, updateDonorMe } from "../controllers/donorController.js";
import { availabilitySchema, donorUpdateSchema } from "../validators/index.js";

const router = Router();

const DONOR = "DONOR" as const;

router.get("/me", requireAuth, requireRole(DONOR), getDonorMe);
router.put("/me", requireAuth, requireRole(DONOR), validateBody(donorUpdateSchema), updateDonorMe);
router.patch(
  "/me/availability",
  requireAuth,
  requireRole(DONOR),
  validateBody(availabilitySchema),
  updateAvailability,
);

export default router;
