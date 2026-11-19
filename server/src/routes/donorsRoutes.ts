import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchDonors } from "../controllers/donorsSearchController.js";

const router = Router();

// Verified-hospital-only donor search (role + verification checked in the
// controller so it can return a precise error message).
router.get("/", requireAuth, searchDonors);

export default router;
