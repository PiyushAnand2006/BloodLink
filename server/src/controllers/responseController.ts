import type { Request, Response } from "express";
import { RequestStatus, ResponseStatus } from "@prisma/client";
import { ApiError } from "../middleware/errors.js";
import { idParamsSchema, responseCreateSchema, responseUpdateSchema } from "../validators/index.js";
import { bloodRequestRepo, requestResponseRepo } from "../utils/repos.js";

/** POST /requests/:id/responses — DONOR, NGO, BLOOD_BANK pledge on an OPEN request. */
export async function createResponse(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const data = responseCreateSchema.parse(req.body);
  const responderId = req.user!.id;

  const request = await bloodRequestOf(id);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }
  if (request.status !== RequestStatus.OPEN) {
    throw new ApiError(409, "This request is no longer open for pledges");
  }

  const existing = await requestResponseRepo.findUnique({
    where: {
      requestId_responderId: { requestId: request.id, responderId },
    },
  });
  if (existing) {
    throw new ApiError(409, "You have already responded to this request");
  }

  const response = await requestResponseRepo.create({
    data: {
      requestId: request.id,
      responderId,
      status: ResponseStatus.PLEDGED,
      message: data.message ?? null,
    },
  });
  res.status(201).json({ response });
}

/**
 * GET /requests/:id/responses — owning hospital only.
 * PRIVACY: a donor's phone is visible to the request owner once the donor
 * has PLEDGED (or been marked DONATED); declined responders stay anonymous.
 */
export async function listResponses(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const userId = req.user!.id;

  const request = await bloodRequestOf(id);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }
  if (request.hospitalId !== userId) {
    throw new ApiError(403, "Only the hospital that raised this request can view responses");
  }

  const rows = await requestResponseRepo.findMany({
    where: { requestId: request.id },
    orderBy: { createdAt: "asc" },
    include: {
      responder: {
        select: {
          id: true,
          name: true,
          role: true,
          city: true,
          phone: true,
          donorProfile: { select: { bloodGroup: true, isRare: true } },
          orgProfile: { select: { orgName: true, contactPerson: true } },
        },
        // phone visibility is filtered per row below
      },
    },
  });

  res.json({
    responses: rows.map((r) => {
      const showPhone = r.status === ResponseStatus.PLEDGED || r.status === ResponseStatus.DONATED;
      return {
        id: r.id,
        status: r.status,
        message: r.message,
        createdAt: r.createdAt,
        responder: {
          id: r.responder.id,
          name: r.responder.name,
          role: r.responder.role,
          city: r.responder.city,
          bloodGroup: r.responder.donorProfile?.bloodGroup ?? null,
          isRare: r.responder.donorProfile?.isRare ?? null,
          orgName: r.responder.orgProfile?.orgName ?? null,
          contactPerson: r.responder.orgProfile?.contactPerson ?? null,
          phone: showPhone ? r.responder.phone : null,
        },
      };
    }),
  });
}

/** GET /responses/mine — the logged-in responder's own responses. */
export async function myResponses(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const rows = await requestResponseRepo.findMany({
    where: { responderId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      request: {
        select: {
          id: true,
          patientName: true,
          bloodGroup: true,
          component: true,
          units: true,
          urgency: true,
          neededBy: true,
          city: true,
          status: true,
          hospital: {
            select: { name: true, orgProfile: { select: { orgName: true } } },
          },
        },
      },
    },
  });

  res.json({
    responses: rows.map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      createdAt: r.createdAt,
      request: {
        id: r.request.id,
        patientName: r.request.patientName,
        bloodGroup: r.request.bloodGroup,
        component: r.request.component,
        units: r.request.units,
        urgency: r.request.urgency,
        neededBy: r.request.neededBy,
        city: r.request.city,
        status: r.request.status,
        hospitalName: r.request.hospital.orgProfile?.orgName ?? r.request.hospital.name,
      },
    })),
  });
}

/**
 * PATCH /responses/:id
 *  - responder sets PLEDGED / DECLINED on their own response
 *  - owning hospital sets DONATED
 */
export async function updateResponse(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const { status } = responseUpdateSchema.parse(req.body);
  const userId = req.user!.id;

  const row = await requestResponseRepo.findUnique({
    where: { id },
    include: { request: { select: { id: true, hospitalId: true, status: true } } },
  });
  if (!row) {
    throw new ApiError(404, "Response not found");
  }

  if (status === ResponseStatus.DONATED) {
    if (row.request.hospitalId !== userId) {
      throw new ApiError(403, "Only the hospital that raised this request can mark a donation");
    }
    if (row.status === ResponseStatus.DECLINED) {
      throw new ApiError(409, "Cannot mark a declined response as donated");
    }
  } else {
    if (row.responderId !== userId) {
      throw new ApiError(403, "You can only update your own response");
    }
    if (row.status === ResponseStatus.DONATED) {
      throw new ApiError(409, "This response was already marked as donated by the hospital");
    }
  }

  const updated = await requestResponseRepo.update({
    where: { id: row.id },
    data: { status },
  });
  res.json({ response: updated });
}

/** DELETE /responses/:id — responder withdraws their own response. */
export async function deleteResponse(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const userId = req.user!.id;

  const row = await requestResponseRepo.findUnique({ where: { id } });
  if (!row || row.responderId !== userId) {
    throw new ApiError(404, "Response not found");
  }
  if (row.status === ResponseStatus.DONATED) {
    throw new ApiError(409, "This response is marked as donated — contact the hospital to amend it");
  }
  await requestResponseRepo.delete({ where: { id: row.id } });
  res.json({ success: true });
}

/** Loads a validated-id blood request row (shared by response endpoints). */
function bloodRequestOf(id: string) {
  return bloodRequestRepo.findUnique({
    where: { id },
    select: { id: true, hospitalId: true, status: true },
  });
}
