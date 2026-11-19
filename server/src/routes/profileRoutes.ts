import { Router } from "express";
import { requireAuth, validateBody } from "../middleware/auth.js";
import { deleteProfile, getProfile, updateProfile } from "../controllers/profileController.js";
import { profileUpdateSchema } from "../validators/index.js";

const router = Router();

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, validateBody(profileUpdateSchema), updateProfile);
router.delete("/", requireAuth, deleteProfile);

export default router;
