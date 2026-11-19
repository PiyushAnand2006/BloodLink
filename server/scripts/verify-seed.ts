/**
 * Read-back check after seeding: prints row counts per table.
 * Run with `npm run db:verify`.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [users, donors, orgs, stocks, camps, requests, responses] =
    await Promise.all([
      prisma.user.count(),
      prisma.donorProfile.count(),
      prisma.orgProfile.count(),
      prisma.stock.count(),
      prisma.camp.count(),
      prisma.bloodRequest.count(),
      prisma.requestResponse.count(),
    ]);

  console.table({ users, donors, orgs, stocks, camps, requests, responses });

  // Spot-check the dashboard inputs: available + eligible donors per group.
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const eligibleDonors = await prisma.donorProfile.findMany({
    where: {
      isAvailable: true,
      OR: [{ lastDonatedOn: null }, { lastDonatedOn: { lte: ninetyDaysAgo } }],
    },
    select: { bloodGroup: true, isRare: true },
  });
  const byGroup: Record<string, number> = {};
  for (const d of eligibleDonors) {
    byGroup[d.bloodGroup] = (byGroup[d.bloodGroup] ?? 0) + 1;
  }
  console.log("Available + eligible donors by blood group:");
  console.table(byGroup);
  console.log(
    "Rare available+eligible donors:",
    eligibleDonors.filter((d) => d.isRare).length,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
