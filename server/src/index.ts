import "dotenv/config";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`✔ BloodLink API ready on http://localhost:${config.PORT}/api`);
  console.log(`  env=${config.NODE_ENV} client=${config.CLIENT_URL}`);
  console.log(
    config.GOOGLE_CLIENT_ID && !config.GOOGLE_CLIENT_ID.startsWith("REPLACE_WITH")
      ? "  Google login: configured"
      : "  Google login: NOT configured (use POST /api/auth/dev locally)",
  );
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — shutting down`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
