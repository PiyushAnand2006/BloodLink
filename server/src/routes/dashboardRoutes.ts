import { Router } from "express";
import { dashboardSummary } from "../controllers/dashboardController.js";

const router = Router();

// Public dashboard summary (8 blood-group tiles + rare donor banner count).
router.get("/summary", dashboardSummary);

export default router;
