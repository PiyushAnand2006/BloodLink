/**
 * BloodLink — local development PostgreSQL helper.
 *
 * Boots a project-local PostgreSQL instance using the binaries shipped by
 * the `@embedded-postgres/<platform>` npm packages (no system install and
 * no Docker required). Data lives in server/.pgdata (gitignored) and the
 * server listens on port 5433 to avoid clashing with any system PostgreSQL.
 * Local authentication is `trust` (dev-only, loopback) — no password needed.
 *
 *   node scripts/dev-db.mjs init     # first-time: initdb + create database
 *   node scripts/dev-db.mjs start    # start (or init + start) and leave running
 *   node scripts/dev-db.mjs stop     # stop
 *   node scripts/dev-db.mjs status   # is it running?
 *
 * Connection string used by .env:
 *   postgresql://postgres@localhost:5433/bloodlink?schema=public
 *
 * For anything beyond local development, use a real PostgreSQL instance
 * (or Docker) and point DATABASE_URL at it instead.
 */

import { spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(SCRIPT_DIR, "..");

const DATA_DIR = path.join(SERVER_ROOT, ".pgdata");
const LOG_FILE = path.join(DATA_DIR, "postgres.log");
const TOOL_LOG = path.join(DATA_DIR, "dev-db-tools.log");
const PORT = 5433;
const SUPERUSER = "postgres";
const DB_NAME = "bloodlink";

const PLATFORM_PKG = {
  win32: "@embedded-postgres/windows-x64",
  darwin: "@embedded-postgres/darwin-x64",
  linux: "@embedded-postgres/linux-x64",
}[process.platform];

if (!PLATFORM_PKG) {
  console.error(`Unsupported platform: ${process.platform}`);
  process.exit(1);
}

const BIN_DIR = path.join(
  SERVER_ROOT,
  "node_modules",
  PLATFORM_PKG,
  "native",
  "bin",
);

const bin = (name) =>
  path.join(BIN_DIR, process.platform === "win32" ? `${name}.exe` : name);

/**
 * Spawn a postgres tool with stdout/stderr redirected to TOOL_LOG.
 *
 * We must NOT let these processes inherit our stdio pipes: `pg_ctl start`
 * detaches `postgres.exe`, which on Windows keeps any inherited pipe handle
 * open forever — the calling pipeline would then wait on pipe EOF and appear
 * to hang even though the server started fine. Redirecting to a file avoids
 * this entirely and keeps tool output inspectable.
 */
function run(name, args) {
  mkdirSync(DATA_DIR, { recursive: true });
  const out = openSync(TOOL_LOG, "a");
  let res;
  try {
    res = spawnSync(bin(name), args, {
      cwd: BIN_DIR,
      stdio: ["ignore", out, out],
    });
  } finally {
    closeSync(out);
  }
  if (res.error) {
    console.error(`Failed to run ${name}: ${res.error.message}`);
    console.error(`See ${TOOL_LOG} for tool output.`);
    process.exit(1);
  }
  if (res.status !== 0) {
    console.error(`✖ ${name} exited with code ${res.status} — see ${TOOL_LOG}`);
    process.exit(res.status ?? 1);
  }
}

function isInitialised() {
  return existsSync(path.join(DATA_DIR, "PG_VERSION"));
}

function isRunning() {
  const res = spawnSync(bin("pg_ctl"), ["-D", DATA_DIR, "status"], {
    encoding: "utf8",
  });
  return res.status === 0;
}

function init() {
  if (isInitialised()) {
    console.log("• data directory already initialised");
    return;
  }
  mkdirSync(DATA_DIR, { recursive: true });
  console.log("• running initdb (first time only) ...");
  run("initdb", [
    "-D", DATA_DIR,
    "-U", SUPERUSER,
    "-A", "trust", // loopback-only dev convenience; not for production
    "-E", "UTF8",
    "--no-locale",
  ]);
}

function createDatabase() {
  const out = openSync(TOOL_LOG, "a");
  let res;
  try {
    res = spawnSync(
      bin("createdb"),
      ["-h", "localhost", "-p", String(PORT), "-U", SUPERUSER, DB_NAME],
      { cwd: BIN_DIR, stdio: ["ignore", out, out] },
    );
  } finally {
    closeSync(out);
  }
  if (res.status === 0) {
    console.log(`• database "${DB_NAME}" created`);
  } else {
    console.log(`• database "${DB_NAME}" already exists`);
  }
}

function start() {
  init();
  if (isRunning()) {
    console.log("• postgres is already running");
  } else {
    console.log(`• starting postgres on port ${PORT} ...`);
    run("pg_ctl", ["-D", DATA_DIR, "-l", LOG_FILE, "-o", `-p ${PORT}`, "start"]);
  }
  createDatabase();
  console.log(`✔ ready: postgresql://${SUPERUSER}@localhost:${PORT}/${DB_NAME}`);
}

function stop() {
  if (!isInitialised()) {
    console.log("• nothing to stop (not initialised)");
    return;
  }
  if (!isRunning()) {
    console.log("• postgres is not running");
    return;
  }
  run("pg_ctl", ["-D", DATA_DIR, "-m", "fast", "stop"]);
  console.log("✔ stopped");
}

function status() {
  console.log(isRunning() ? "running" : "stopped");
}

const command = process.argv[2];
switch (command) {
  case "init":
    init();
    createDatabase();
    break;
  case "start":
    start();
    break;
  case "stop":
    stop();
    break;
  case "status":
    status();
    break;
  default:
    console.error("Usage: node scripts/dev-db.mjs <init|start|stop|status>");
    process.exit(1);
}
