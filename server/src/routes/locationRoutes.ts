import { Router } from "express";
import { listDistricts } from "../controllers/districtsController.js";
import { searchAvailability } from "../controllers/availabilityController.js";

const router = Router();

// Public master list — one source for every district dropdown in the app.
router.get("/districts", listDistricts);

// Public blood-stock search filtered in the database (district derived from
// the holding institution; group + component on the inventory row).
router.get("/availability", searchAvailability);

export default router;
