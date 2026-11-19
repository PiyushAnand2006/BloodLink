# BloodLink — Run Guide

Quick, practical steps to run, test and maintain the project locally.
For architecture and design rationale see [Architecture.md](./Architecture.md) and
[Design.md](./Design.md); for the full setup and OAuth walkthrough see [README.md](./README.md).

---

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 20+ (tested on 25) | `node --version` |
| npm 10+ | ships with Node |
| Git | for cloning/pushing |
| PostgreSQL | **not required** — the repo ships a project-local PostgreSQL via npm binaries (see below) |

**Ports used:** `3000` client · `4000` API · `5433` local PostgreSQL.
Make sure they are free before starting (`netstat -ano | findstr ":3000 :4000 :5433"`).

---

## 2. Quick start (machine already configured)

`server/.env` and `client/.env.local` already exist here, so:

```bash
# 1) Database (first time only: init + create database)
cd server
npm run db:start
npm run db:migrate
npm run db:seed

# 2) API — terminal 1
cd server
npm run dev            # http://localhost:4000/api

# 3) Client — terminal 2
cd client
npm run dev            # http://localhost:3000 (hot reload)
```

Production-style client run (what is currently used on this machine):

```bash
cd client
npm run build
npm start              # serves the built app on http://localhost:3000
```

Stop everything:

```bash
npm run db:stop        # in server/ — stops the local PostgreSQL
# client/API: Ctrl+C in their terminals, or
#   netstat -ano | findstr ":3000 :4000"   → note LISTENING PIDs
#   taskkill /PID <pid> /F
```

---

## 3. Fresh clone setup (from zero)

```bash
git clone <repo-url> bloodlink && cd bloodlink

# --- Server ---
cd server
npm install
copy .env.example .env        # then edit .env (see “Environment variables”)
npm run db:start              # boots project-local PostgreSQL on port 5433
npm run db:migrate            # applies Prisma migrations
npm run db:seed               # loads demo data (23 users, 32 stock rows, 8 requests, 3 camps)
npm run dev                   # API on http://localhost:4000/api

# --- Client (new terminal) ---
cd client
npm install
copy .env.example .env.local  # then edit (see “Environment variables”)
npm run dev                   # http://localhost:3000
```

> The local database is intentionally **dev-only**: loopback `trust` auth, data stored in
> `server/.pgdata` (gitignored). For production use a real PostgreSQL instance and point
> `DATABASE_URL` at it.

---

## 4. Environment variables

### `server/.env` (copy from `server/.env.example`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 4000) |
| `DATABASE_URL` | PostgreSQL connection string (local dev: `postgresql://postgres@localhost:5433/bloodlink?schema=public`) |
| `JWT_SECRET` | Long random string (`openssl rand -hex 48`) — signs session cookies |
| `JWT_EXPIRES_IN` | Cookie lifetime (`7d`) |
| `GOOGLE_CLIENT_ID` | OAuth client ID used to verify Google ID tokens |
| `SEED_DEMO_PASSWORD` | Password given to **all seeded accounts** by `db:seed` (min 8 chars; avoid `#` — dotenv truncates it) |
| `CLIENT_URL` | Exact client origin allowed by CORS (`http://localhost:3000`) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_AUTH_MAX` | Requests per 15 min (defaults 300 / 30; this machine uses 1000 / 100 for local testing) |

### `client/.env.local` (copy from `client/.env.example`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL (`http://localhost:4000/api`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same OAuth client ID — renders the Google button |
| `NEXT_PUBLIC_DEV_LOGIN` | `true` shows the demo-accounts quick-login panel on `/login` |

> `NEXT_PUBLIC_*` values are **baked in at build time** — after changing them you must
> `npm run build` again if you serve with `npm start`.

---

## 5. Signing in (demo accounts)

| Method | How |
| --- | --- |
| **Demo quick-login** (dev only) | `/login` → “Demo accounts (dev only)” panel → one-click sign-in as Ananya (donor), Apollo (hospital), Rakta (NGO), Red Cross (blood bank), Jeevan Dhara (unverified NGO) or Admin. Shown while `NEXT_PUBLIC_DEV_LOGIN=true`. |
| **Email + password** | Any seeded email (e.g. `apollo.bengaluru@bloodlink.test`) + the password set in `SEED_DEMO_PASSWORD` |
| **Google** | Real OAuth button once `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured; new Google accounts complete registration (role + profile) on `/signup` |

New accounts: `/signup` — pick a role (Donor / NGO / Blood bank / Hospital), fill the form, finish
with email+password or Google. Public pages (home, requests, camps) are browsable without an
account; the dashboard requires sign-in.

---

## 6. Verification & tests

```bash
cd server
npm run api:test      # 105-check integration suite (API must be running)
npm run db:verify     # row counts + eligible donors per blood group
cd client
npm run build         # type-check + production build gate
```

---

## 7. Maintenance commands (server/)

| Command | Effect |
| --- | --- |
| `npm run db:start` | Initialise (first time) + start local PostgreSQL on 5433 |
| `npm run db:stop` | Stop it |
| `npm run db:status` | Running? |
| `npm run db:migrate` | Apply migrations in dev |
| `npm run db:seed` | **Wipes and re-creates** all demo data |
| `npm run db:reset` | Drop schema + re-migrate + re-seed |
| `npm run db:studio` | Prisma Studio GUI (http://localhost:5555) |
| `npm run api:test` | Full API integration suite |

---

## 8. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `EADDRINUSE` on 3000/4000 | An old server still holds the port: `netstat -ano \| findstr :3000` → `taskkill /PID <pid> /F`, then restart. Old node processes can survive terminal kills on Windows. |
| Login says “Too many requests” | Auth rate limit hit (30/15 min by default). This machine’s `.env` raises it to 100; wait 15 minutes or adjust `RATE_LIMIT_AUTH_MAX`. |
| Seed fails mentioning `SEED_DEMO_PASSWORD` | The variable is missing/short in `server/.env`. Also avoid `#` in the value — dotenv truncates at `#`. |
| Google button missing on `/login` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` not set (client) or placeholder — set it and **rebuild** the client. |
| “No account exists with this email” | Expected: sign-in never auto-creates accounts. Use `/signup` (or the demo panel) first. |
| Google popup blocked / “app not verified” | Add your Gmail under Google Auth Platform → Audience → Testing users. |
| Client changes not visible | You are serving the production build — `npm run build` again, or switch to `npm run dev`. |
| npm blocks install scripts | `npm install-scripts approve prisma @prisma/client @prisma/engines esbuild @embedded-postgres/windows-x64` then `npm rebuild`. |
| Stale `.next/types` errors after deleting a page | Run `npm run build` — the generated types refresh themselves. |

---

## 9. Where to go next

- [README.md](./README.md) — full setup, Google OAuth console steps, API reference
- [Architecture.md](./Architecture.md) — system diagram, auth flow, data model
- [PRD.md](./PRD.md) — requirements and privacy rules
- [Memory.md](./Memory.md) — decisions log and known gotchas (kept current)
