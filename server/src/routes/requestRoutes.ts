import { Router } from "express";
import { attachUser, requireAuth, requireRole, validateBody } from "../middleware/auth.js";
import {
  createRequest,
  deleteRequest,
  getRequest,
  listRequests,
  updateRequest,
  updateRequestStatus,
} from "../controllers/requestController.js";
import {
  createResponse,
  listResponses,
} from "../controllers/responseController.js";
import {
  requestCreateSchema,
  requestStatusUpdateSchema,
  requestUpdateSchema,
  responseCreateSchema,
} from "../validators/index.js";

const router = Router();

// Public feed / detail (richer when logged in via attachUser).
router.get("/", attachUser, listRequests);
router.get("/:id", attachUser, getRequest);

// Hospital-only CRUD.
router.post("/", requireAuth, requireRole("HOSPITAL"), validateBody(requestCreateSchema), createRequest);
router.put("/:id", requireAuth, requireRole("HOSPITAL"), validateBody(requestUpdateSchema), updateRequest);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("HOSPITAL"),
  validateBody(requestStatusUpdateSchema),
  updateRequestStatus,
);
router.delete("/:id", requireAuth, requireRole("HOSPITAL"), deleteRequest);

// Responses on a request.
router.post(
  "/:id/responses",
  requireAuth,
  requireRole("DONOR", "NGO", "BLOOD_BANK"),
  validateBody(responseCreateSchema),
  createResponse,
);
router.get("/:id/responses", requireAuth, requireRole("HOSPITAL"), listResponses);

export default router;
