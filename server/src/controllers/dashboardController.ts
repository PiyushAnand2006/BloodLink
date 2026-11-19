import type { Request, Response } from "express";
import { RequestStatus, Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { BLOOD_GROUP_ORDER, eligibilityCutoff, supplyLevel } from "../utils/blood.js";
import { parseQuery, dashboardQuerySchema } from "../validators/query.js";

/**
 * GET /dashboard/summary?city=&component=
 * Public. Returns one tile per blood group:
 *   donorsAvailable — available + eligible donors (role DONOR)
 *   unitsAvailable  — NGO + blood bank stock for the component
 *   openRequests    — open hospital requests for the component
 *   level           — RED (0 supply) / AMBER (1-4) / GREEN (5+), from supply only
 * plus a rare-donor banner count.
 */
export async function dashboardSummary(req: Request, res: Response): Promise<void> {
  const q = parseQuery(dashboardQuerySchema, req.query);
  const component = q.component ?? "WHOLE_BLOOD";
  const cityFilter = q.city
    ? { city: { equals: q.city, mode: "insensitive" as const } }
    : undefined;

  const donorWhere = {
    isAvailable: true,
    user: { role: Role.DONOR, ...(cityFilter ?? {}) },
    OR: [{ lastDonatedOn: null }, { lastDonatedOn: { lte: eligibilityCutoff() } }],
  };

  const [donorRows, stockGroups, requestRows, rareCount] = await Promise.all([
    prisma.donorProfile.findMany({
      where: donorWhere,
      select: { bloodGroup: true },
    }),
    prisma.stock.groupBy({
      by: ["bloodGroup"],
      _sum: { units: true },
      where: {
        component,
        // org is the org's User row — apply the city filter there.
        ...(cityFilter ? { org: cityFilter } : {}),
      },
    }),
    prisma.bloodRequest.findMany({
      where: {
        status: RequestStatus.OPEN,
        component,
        ...(cityFilter ?? {}),
      },
      select: { bloodGroup: true },
    }),
    prisma.donorProfile.count({ where: { ...donorWhere, isRare: true } }),
  ]);

  const countByGroup = (rows: Array<{ bloodGroup: string }>): Map<string, number> => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.bloodGroup, (map.get(r.bloodGroup) ?? 0) + 1);
    return map;
  };
  const donorsByGroup = countByGroup(donorRows);
  const unitsByGroup = new Map(stockGroups.map((g) => [g.bloodGroup, g._sum.units ?? 0]));
  const requestsByGroup = countByGroup(requestRows);

  const summary = BLOOD_GROUP_ORDER.map((bloodGroup) => {
    const donorsAvailable = donorsByGroup.get(bloodGroup) ?? 0;
    const unitsAvailable = unitsByGroup.get(bloodGroup) ?? 0;
    const openRequests = requestsByGroup.get(bloodGroup) ?? 0;
    return {
      bloodGroup,
      donorsAvailable,
      unitsAvailable,
      openRequests,
      level: supplyLevel(donorsAvailable, unitsAvailable),
    };
  });

  res.json({
    summary,
    rareDonorsAvailable: rareCount,
    filters: { city: q.city ?? null, component },
    updatedAt: new Date().toISOString(),
  });
}
