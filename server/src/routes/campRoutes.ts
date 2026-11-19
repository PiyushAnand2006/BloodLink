import { Router } from "express";
import { attachUser, requireAuth, requireRole, validateBody } from "../middleware/auth.js";
import { createCamp, deleteCamp, listCamps, updateCamp } from "../controllers/campController.js";
import { campCreateSchema } from "../validators/index.js";

const router = Router();

// Public listing (`mine=true` switches to the NGO's own view, auth checked inside).
router.get("/", attachUser, listCamps);

router.post("/", requireAuth, requireRole("NGO"), validateBody(campCreateSchema), createCamp);
router.put("/:id", requireAuth, requireRole("NGO"), validateBody(campCreateSchema), updateCamp);
router.delete("/:id", requireAuth, requireRole("NGO"), deleteCamp);

export default router;
