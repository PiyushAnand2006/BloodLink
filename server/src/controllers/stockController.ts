import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { ApiError } from "../middleware/errors.js";
import { idParamsSchema, stockCreateSchema, stockUpdateSchema } from "../validators/index.js";

/** GET /stock/mine — the logged-in org's stock rows. */
export async function myStock(req: Request, res: Response): Promise<void> {
  const stock = await prisma.stock.findMany({
    where: { orgId: req.user!.id },
    orderBy: [{ bloodGroup: "asc" }, { component: "asc" }],
  });
  res.json({ stock });
}

/** POST /stock — create a stock row (org-scoped). */
export async function createStock(req: Request, res: Response): Promise<void> {
  const data = stockCreateSchema.parse(req.body);
  const existing = await prisma.stock.findUnique({
    where: {
      orgId_bloodGroup_component: {
        orgId: req.user!.id,
        bloodGroup: data.bloodGroup,
        component: data.component,
      },
    },
  });
  if (existing) {
    throw new ApiError(
      409,
      "A stock row for this blood group and component already exists — update it instead",
    );
  }
  const row = await prisma.stock.create({
    data: { ...data, orgId: req.user!.id },
  });
  res.status(201).json({ stock: row });
}

/** PUT /stock/:id — update units and/or re-tag group/component (owner only). */
export async function updateStock(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const data = stockUpdateSchema.parse(req.body);
  const userId = req.user!.id;
  const row = await prisma.stock.findUnique({ where: { id } });
  if (!row || row.orgId !== userId) {
    throw new ApiError(404, "Stock row not found");
  }

  const nextGroup = data.bloodGroup ?? row.bloodGroup;
  const nextComponent = data.component ?? row.component;
  if (nextGroup !== row.bloodGroup || nextComponent !== row.component) {
    const clash = await prisma.stock.findUnique({
      where: {
        orgId_bloodGroup_component: {
          orgId: userId,
          bloodGroup: nextGroup,
          component: nextComponent,
        },
      },
    });
    if (clash) {
      throw new ApiError(409, "A stock row for that blood group and component already exists");
    }
  }

  const updated = await prisma.stock.update({
    where: { id: row.id },
    data: { units: data.units, bloodGroup: nextGroup, component: nextComponent },
  });
  res.json({ stock: updated });
}

/** DELETE /stock/:id — owner only. */
export async function deleteStock(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const userId = req.user!.id;
  const row = await prisma.stock.findUnique({ where: { id } });
  if (!row || row.orgId !== userId) {
    throw new ApiError(404, "Stock row not found");
  }
  await prisma.stock.delete({ where: { id: row.id } });
  res.json({ success: true });
}
