import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";

const listSchema = z.object({
  state: z.string().trim().min(2).max(80).optional(),
});

/**
 * GET /districts — public master list for every dropdown in the app.
 * One consistent source: the District table (seeded from src/data/).
 */
export async function listDistricts(req: Request, res: Response): Promise<void> {
  const { state } = listSchema.parse(req.query ?? {});
  const districts = await prisma.district.findMany({
    where: state ? { state: { equals: state, mode: "insensitive" } } : undefined,
    orderBy: [{ state: "asc" }, { name: "asc" }],
    select: { id: true, state: true, name: true },
  });
  res.json({ districts, total: districts.length });
}
