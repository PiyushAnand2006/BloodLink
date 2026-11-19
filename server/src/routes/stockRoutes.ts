import { Router } from "express";
import { requireAuth, requireRole, validateBody } from "../middleware/auth.js";
import { createStock, deleteStock, myStock, updateStock } from "../controllers/stockController.js";
import { stockCreateSchema, stockUpdateSchema } from "../validators/index.js";

const router = Router();

const ORG_ROLES = ["NGO", "BLOOD_BANK"] as const;

router.get("/mine", requireAuth, requireRole(...ORG_ROLES), myStock);
router.post("/", requireAuth, requireRole(...ORG_ROLES), validateBody(stockCreateSchema), createStock);
router.put("/:id", requireAuth, requireRole(...ORG_ROLES), validateBody(stockUpdateSchema), updateStock);
router.delete("/:id", requireAuth, requireRole(...ORG_ROLES), deleteStock);

export default router;
