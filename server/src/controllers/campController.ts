import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { ApiError } from "../middleware/errors.js";
import { campCreateSchema, idParamsSchema } from "../validators/index.js";
import { parseQuery, campsQuerySchema } from "../validators/query.js";

/** Validates the venue district id (if provided) against the master table. */
async function assertDistrictExists(districtId: string | null | undefined): Promise<void> {
  if (!districtId) return;
  const district = await prisma.district.findUnique({ where: { id: districtId } });
  if (!district) {
    throw new ApiError(400, "Unknown district");
  }
}

/** GET /camps — public list (filter: city, district, date). `mine=true` lists the NGO's own camps. */
export async function listCamps(req: Request, res: Response): Promise<void> {
  const q = parseQuery(campsQuerySchema, req.query);

  if (q.mine === "true") {
    if (req.user?.role !== "NGO") {
      throw new ApiError(403, "Only NGOs can list their own camps");
    }
    const camps = await prisma.camp.findMany({
      where: { orgId: req.user.id },
      orderBy: { date: "asc" },
      include: { district: { select: { name: true } } },
    });
    res.json({
      camps: camps.map((c) => ({ ...c, districtName: c.district?.name ?? null, district: undefined })),
    });
    return;
  }

  const camps = await prisma.camp.findMany({
    where: {
      ...(q.city ? { city: { equals: q.city, mode: "insensitive" } } : {}),
      ...(q.districtId ? { districtId: q.districtId } : {}),
      ...(q.date
        ? {
            date: {
              gte: new Date(`${q.date}T00:00:00`),
              lte: new Date(`${q.date}T23:59:59.999`),
            },
          }
        : {}),
    },
    orderBy: { date: "asc" },
    include: {
      district: { select: { name: true } },
      org: {
        select: {
          id: true,
          name: true,
          city: true,
          orgProfile: {
            select: {
              orgName: true,
              contactPerson: true,
              district: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  res.json({
    camps: camps.map((c) => ({
      ...c,
      districtName: c.district?.name ?? null,
      orgDistrict: c.org.orgProfile?.district?.name ?? null,
      district: undefined,
      org: {
        ...c.org,
        orgProfile: c.org.orgProfile
          ? { ...c.org.orgProfile, district: undefined, districtName: c.org.orgProfile.district?.name ?? null }
          : null,
      },
    })),
  });
}

/** POST /camps — NGO only. */
export async function createCamp(req: Request, res: Response): Promise<void> {
  const data = campCreateSchema.parse(req.body);
  await assertDistrictExists(data.districtId);
  const camp = await prisma.camp.create({
    data: { ...data, orgId: req.user!.id },
    include: { district: { select: { name: true } } },
  });
  res.status(201).json({ camp: { ...camp, districtName: camp.district?.name ?? null, district: undefined } });
}

/** PUT /camps/:id — NGO owner only. */
export async function updateCamp(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const data = campCreateSchema.parse(req.body);
  const userId = req.user!.id;
  await assertDistrictExists(data.districtId);
  const camp = await prisma.camp.findUnique({ where: { id } });
  if (!camp || camp.orgId !== userId) {
    throw new ApiError(404, "Camp not found");
  }
  const updated = await prisma.camp.update({
    where: { id: camp.id },
    data,
    include: { district: { select: { name: true } } },
  });
  res.json({ camp: { ...updated, districtName: updated.district?.name ?? null, district: undefined } });
}

/** DELETE /camps/:id — NGO owner only. */
export async function deleteCamp(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const userId = req.user!.id;
  const camp = await prisma.camp.findUnique({ where: { id } });
  if (!camp || camp.orgId !== userId) {
    throw new ApiError(404, "Camp not found");
  }
  await prisma.camp.delete({ where: { id: camp.id } });
  res.json({ success: true });
}
