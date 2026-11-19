import { Router } from "express";
import { requireAuth, requireRole, validateBody } from "../middleware/auth.js";
import { deleteResponse, myResponses, updateResponse } from "../controllers/responseController.js";
import { responseUpdateSchema } from "../validators/index.js";

const router = Router();

const RESPONDER_ROLES = ["DONOR", "NGO", "BLOOD_BANK"] as const;

router.get("/mine", requireAuth, requireRole(...RESPONDER_ROLES), myResponses);

// PATCH allows both the responder (PLEDGED/DECLINED) and the owning
// hospital (DONATED) — the controller applies the per-status ownership rule.
router.patch("/:id", requireAuth, validateBody(responseUpdateSchema), updateResponse);
router.delete("/:id", requireAuth, deleteResponse);

export default router;
