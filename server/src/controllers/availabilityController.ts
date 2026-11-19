import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { parseQuery, availabilityQuerySchema } from "../validators/query.js";

/**
 * GET /availability?districtId=&bloodGroup=&component=
 *
 * Public blood-stock search (functional reference: the e-RaktKosh
 * stock-search experience — not its branding). Filtering happens in the
 * database: stock rows are matched on group/component and their district is
 * DERIVED from the holding institution's registered location — inventory
 * rows carry no district of their own.
 *
 * Registered inventory is reported as-is (units + last-updated timestamp);
 * it is not a guarantee of real-time availability.
 */
export async function searchAvailability(req: Request, res: Response): Promise<void> {
  const q = parseQuery(availabilityQuerySchema, req.query);

  const rows = await prisma.stock.findMany({
    where: {
      ...(q.bloodGroup ? { bloodGroup: q.bloodGroup } : {}),
      ...(q.component ? { component: q.component } : {}),
      // District is derived from the holding organisation's registered location.
      ...(q.districtId
        ? { org: { orgProfile: { is: { districtId: q.districtId } } } }
        : {}),
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          role: true,
          orgProfile: {
            select: {
              orgName: true,
              address: true,
              contactPerson: true,
              isVerified: true,
              district: { select: { name: true, state: true } },
            },
          },
        },
      },
    },
  });

  // Most units first, then by organisation name — same units, stable order.
  const results = rows
    .map((row) => ({
      id: row.id,
      orgId: row.org.id,
      orgName: row.org.orgProfile?.orgName ?? row.org.name,
      orgRole: row.org.role,
      isVerified: row.org.orgProfile?.isVerified ?? false,
      district: row.org.orgProfile?.district?.name ?? null,
      districtState: row.org.orgProfile?.district?.state ?? null,
      address: row.org.orgProfile?.address ?? null,
      contactPerson: row.org.orgProfile?.contactPerson ?? null,
      bloodGroup: row.bloodGroup,
      component: row.component,
      units: row.units,
      updatedAt: row.updatedAt,
    }))
    .sort(
      (a, b) =>
        b.units - a.units ||
        a.orgName.localeCompare(b.orgName) ||
        a.bloodGroup.localeCompare(b.bloodGroup),
    );

  res.json({
    results,
    total: results.length,
    filters: {
      districtId: q.districtId ?? null,
      bloodGroup: q.bloodGroup ?? null,
      component: q.component ?? null,
    },
    // Inventory is as reported by the institution — never a guarantee.
    note: "Availability is as last reported by the institution. Confirm with the blood bank before transfusion decisions.",
  });
}
