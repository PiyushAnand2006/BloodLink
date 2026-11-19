import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const real = await prisma.user.findMany({
  where: {
    AND: [
      { googleId: { not: { startsWith: "seed-" } } },
      { googleId: { not: { startsWith: "dev-" } } },
    ],
  },
  select: { id: true, email: true, name: true, role: true, createdAt: true },
});

console.log(JSON.stringify(real, null, 2));
await prisma.$disconnect();
