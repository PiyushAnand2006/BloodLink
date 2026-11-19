import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { ApiError } from "../middleware/errors.js";
import { campCreateSchema, idParamsSchema } from "../validators/index.js";
import { parseQuery, campsQuerySchema } from "../validators/query.js";

/** GET /camps — public list (filter: city, date). `mine=true` lists the NGO's own camps. */
export async function listCamps(req: Request, res: Response): Promise<void> {
  const q = parseQuery(campsQuerySchema, req.query);

  if (q.mine === "true") {
    if (req.user?.role !== "NGO") {
      throw new ApiError(403, "Only NGOs can list their own camps");
    }
    const camps = await prisma.camp.findMany({
      where: { orgId: req.user.id },
      orderBy: { date: "asc" },
    });
    res.json({ camps });
    return;
  }

  const camps = await prisma.camp.findMany({
    where: {
      ...(q.city ? { city: { equals: q.city, mode: "insensitive" } } : {}),
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
      org: {
        select: {
          id: true,
          name: true,
          city: true,
          orgProfile: { select: { orgName: true, contactPerson: true } },
        },
      },
    },
  });
  res.json({ camps });
}

/** POST /camps — NGO only. */
export async function createCamp(req: Request, res: Response): Promise<void> {
  const data = campCreateSchema.parse(req.body);
  const camp = await prisma.camp.create({
    data: { ...data, orgId: req.user!.id },
  });
  res.status(201).json({ camp });
}

/** PUT /camps/:id — NGO owner only. */
export async function updateCamp(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const data = campCreateSchema.parse(req.body);
  const userId = req.user!.id;
  const camp = await prisma.camp.findUnique({ where: { id } });
  if (!camp || camp.orgId !== userId) {
    throw new ApiError(404, "Camp not found");
  }
  const updated = await prisma.camp.update({ where: { id: camp.id }, data });
  res.json({ camp: updated });
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
