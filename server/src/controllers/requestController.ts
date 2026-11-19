import type { Request, Response } from "express";
import { RequestStatus, Role } from "@prisma/client";
import { ApiError } from "../middleware/errors.js";
import { RESPONDER_ROLES } from "../middleware/auth.js";
import {
  idParamsSchema,
  requestCreateSchema,
  requestStatusUpdateSchema,
  requestUpdateSchema,
} from "../validators/index.js";
import { parseQuery, requestsQuerySchema } from "../validators/query.js";
import { bloodRequestRepo, requestResponseRepo } from "../utils/repos.js";

const URGENCY_RANK: Record<string, number> = { CRITICAL: 0, URGENT: 1, NORMAL: 2 };

/**
 * PRIVACY RULE: a hospital's phone is visible only to logged-in responders
 * (DONOR / NGO / BLOOD_BANK) on an OPEN request. The owner sees their own
 * contact details through their hospital console, so it is not re-exposed here.
 */
function canSeeHospitalPhone(
  user: Request["user"],
  request: { hospitalId: string; status: RequestStatus },
): boolean {
  if (!user || !user.role) return false;
  if (user.id === request.hospitalId) return false;
  if (request.status !== RequestStatus.OPEN) return false;
  return RESPONDER_ROLES.includes(user.role);
}

const hospitalInclude = {
  hospital: {
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      pincode: true,
      orgProfile: {
        select: {
          orgName: true,
          contactPerson: true,
          district: { select: { name: true } },
        },
      },
    },
  },
} as const;

interface RequestRow {
  id: string;
  hospitalId: string;
  patientName: string;
  bloodGroup: string;
  component: string;
  units: number;
  urgency: string;
  neededBy: Date;
  city: string;
  pincode: string;
  note: string | null;
  status: RequestStatus;
  createdAt: Date;
  hospital: {
    id: string;
    name: string;
    phone: string | null;
    city: string | null;
    pincode: string | null;
    orgProfile: {
      orgName: string;
      contactPerson: string;
      district: { name: string } | null;
    } | null;
  };
}

function toPublicRequest(
  row: RequestRow,
  user: Request["user"],
  extra: Record<string, unknown> = {},
) {
  const { hospital, ...requestFields } = row;
  return {
    ...requestFields,
    hospital: {
      id: hospital.id,
      orgName: hospital.orgProfile?.orgName ?? hospital.name,
      city: hospital.city,
      contactPerson: hospital.orgProfile?.contactPerson ?? null,
      district: hospital.orgProfile?.district?.name ?? null,
    },
    hospitalPhone: canSeeHospitalPhone(user, row) ? hospital.phone : null,
    ...extra,
  };
}

/** GET /requests — public feed with filters; `mine=true` for the owning hospital. */
export async function listRequests(req: Request, res: Response): Promise<void> {
  const q = parseQuery(requestsQuerySchema, req.query);
  const userId = req.user?.id;
  const role = req.user?.role;

  // Owner view: all of this hospital's requests with a responders count.
  if (q.mine === "true") {
    if (role !== Role.HOSPITAL || !userId) {
      throw new ApiError(403, "Only hospitals can list their own requests");
    }
    const rows = await bloodRequestRepo.findMany({
      where: { hospitalId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { responses: { where: { status: { in: ["PLEDGED", "DONATED"] } } } },
        },
      },
    });
    res.json({
      requests: rows.map((r) => ({
        ...r,
        respondersCount: r._count.responses,
        _count: undefined,
      })),
    });
    return;
  }

  const where = {
    ...(q.bloodGroup ? { bloodGroup: q.bloodGroup } : {}),
    ...(q.component ? { component: q.component } : {}),
    ...(q.city ? { city: { equals: q.city, mode: "insensitive" as const } } : {}),
    ...(q.pincode ? { pincode: q.pincode } : {}),
    ...(q.urgency ? { urgency: q.urgency } : {}),
    // Default to OPEN requests for the public feed.
    status: q.status ?? RequestStatus.OPEN,
  };

  const rows = await bloodRequestRepo.findMany({
    where,
    orderBy: [{ neededBy: "asc" }],
    take: 200,
    include: hospitalInclude,
  });

  // Emergency feed order: most urgent first, then soonest neededBy.
  const sorted = [...rows].sort(
    (a, b) =>
      URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
      a.neededBy.getTime() - b.neededBy.getTime(),
  );

  // Attach the logged-in responder's own response status per request (cheap batch).
  const myResponses = new Map<string, string>();
  if (userId && role && RESPONDER_ROLES.includes(role)) {
    const mine = await requestResponseRepo.findMany({
      where: { responderId: userId, requestId: { in: rows.map((r) => r.id) } },
      select: { requestId: true, status: true },
    });
    for (const m of mine) myResponses.set(m.requestId, m.status);
  }

  res.json({
    requests: sorted.map((r) =>
      toPublicRequest(r, req.user, {
        myResponseStatus: myResponses.get(r.id) ?? null,
      }),
    ),
  });
}

/** GET /requests/:id — public detail. */
export async function getRequest(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const viewer = req.user;
  const row = await bloodRequestRepo.findUnique({
    where: { id },
    include: { ...hospitalInclude, _count: { select: { responses: true } } },
  });
  if (!row) {
    throw new ApiError(404, "Request not found");
  }

  let myResponse: { id: string; status: string; message: string | null; createdAt: Date } | null =
    null;
  if (viewer && viewer.role && RESPONDER_ROLES.includes(viewer.role)) {
    const existing = await requestResponseRepo.findUnique({
      where: {
        requestId_responderId: { requestId: row.id, responderId: viewer.id },
      },
      select: { id: true, status: true, message: true, createdAt: true },
    });
    myResponse = existing;
  }

  res.json({
    request: toPublicRequest(row, viewer, {
      responsesCount: row._count.responses,
      isOwner: viewer?.id === row.hospitalId,
      myResponse,
    }),
  });
}

/** POST /requests — HOSPITAL only. */
export async function createRequest(req: Request, res: Response): Promise<void> {
  const data = requestCreateSchema.parse(req.body);
  const hospitalId = req.user!.id;
  const created = await bloodRequestRepo.create({
    data: { ...data, hospitalId },
    include: hospitalInclude,
  });
  res.status(201).json({ request: toPublicRequest(created, req.user) });
}

/** PUT /requests/:id — owner hospital only. */
export async function updateRequest(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const data = requestUpdateSchema.parse(req.body);
  const userId = req.user!.id;

  const row = await bloodRequestRepo.findUnique({ where: { id } });
  if (!row || row.hospitalId !== userId) {
    throw new ApiError(404, "Request not found");
  }

  const updated = await bloodRequestRepo.update({
    where: { id: row.id },
    data: {
      patientName: data.patientName,
      bloodGroup: data.bloodGroup,
      component: data.component,
      units: data.units,
      urgency: data.urgency,
      city: data.city,
      pincode: data.pincode,
      note: data.note ?? null,
      ...(data.neededBy ? { neededBy: data.neededBy } : {}),
    },
    include: hospitalInclude,
  });
  res.json({ request: toPublicRequest(updated, req.user) });
}

/** PATCH /requests/:id/status — owner hospital only. */
export async function updateRequestStatus(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const { status } = requestStatusUpdateSchema.parse(req.body);
  const userId = req.user!.id;

  const row = await bloodRequestRepo.findUnique({ where: { id } });
  if (!row || row.hospitalId !== userId) {
    throw new ApiError(404, "Request not found");
  }

  const updated = await bloodRequestRepo.update({
    where: { id: row.id },
    data: { status },
    include: hospitalInclude,
  });
  res.json({ request: toPublicRequest(updated, req.user) });
}

/** DELETE /requests/:id — owner hospital only. Responses cascade-delete. */
export async function deleteRequest(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const userId = req.user!.id;

  const row = await bloodRequestRepo.findUnique({ where: { id } });
  if (!row || row.hospitalId !== userId) {
    throw new ApiError(404, "Request not found");
  }
  await bloodRequestRepo.delete({ where: { id: row.id } });
  res.json({ success: true });
}
