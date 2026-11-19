import { Router } from "express";
import { requireAuth, requireRole, validateBody } from "../middleware/auth.js";
import { verifyOrg } from "../controllers/adminController.js";
import { verifyOrgSchema } from "../validators/index.js";

const router = Router();

router.patch(
  "/orgs/:userId/verify",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(verifyOrgSchema),
  verifyOrg,
);

export default router;
