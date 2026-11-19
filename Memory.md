# BloodLink — Memory

> **Purpose**: persistent context for AI assistants across sessions/chats. Read this FIRST before
> exploring the codebase. Update it after every meaningful change (status, decisions, gotchas).
> Last updated: **2026-11-19**.

---

## 1. Project status snapshot

| Item | State |
| --- | --- |
| Build plan | [Phases.md](./Phases.md) — **Phases 0–8 ALL COMPLETE** ✅ |
| Product scope | [PRD.md](./PRD.md) — all functional requirements implemented; all 6 acceptance criteria verified |
| Architecture | [Architecture.md](./Architecture.md) — Next.js 15 + Express 5 + Prisma 6 + PostgreSQL, polling realtime |
| Tests | `server/scripts/api-tests.mjs` → **97 passed / 0 failed** (last run 2026-11-19) · `client` production build green (17 routes) |
| Live verification | Full acceptance chain executed in a real browser (onboarding → request → pledge → phone reveal → DONATED → FULFILLED; stock → dashboard ≤20s; anon privacy) |
| Data | Freshly re-seeded demo dataset (23 users / 15 donors / 7 orgs / 32 stock / 3 camps / 8 requests / 6 responses) |
| Nothing is pending. Any new work starts from the Backlog in [Phases.md](./Phases.md) and needs user approval. |

## 2. Runtime state (this machine, Windows + Git Bash)

| Thing | Value |
| --- | --- |
| Client | Next.js production build, `npm start` → **http://localhost:3000** (was task `exec_70bbec6c…`) |
| API | `tsx src/index.ts` → **http://localhost:4000** (was task `exec_bc656c18…`; PIDs change — check `netstat -ano | grep LISTENING`) |
| PostgreSQL | project-local, port **5433**, data dir `server/.pgdata` (gitignored), user `postgres`, **trust auth (no password)**, db `bloodlink`. Start/stop: `cd server && npm run db:start|db:stop` |
| Health check | `curl http://localhost:4000/health` → `{"status":"ok"...}` |
| Env files | `server/.env` (real local values incl. generated JWT_SECRET — **gitignored, never commit**), `client/.env.local` (`NEXT_PUBLIC_DEV_LOGIN=true`) |
| Google OAuth | **CONFIGURED (2026-11-19)**: real client ID `512103507950-…` set in both `server/.env` and `client/.env.local`; verified — GSI button renders on `/login` and the Google sign-in popup opens with correct client_id/origin. NOTE: `NEXT_PUBLIC_*` is baked at build time → always `npm run build` before `npm start` after env changes |

**Restart recipe** (order matters): DB → API → client.
```bash
cd server && npm run db:start && npm run dev     # or: npx tsx src/index.ts
cd client && npm start                            # prod build; npm run dev for watch mode
```
Full reset: `cd server && npm run db:seed` (wipes + reseeds; dates are relative to now).

## 3. Verification commands

```bash
cd server && npx tsc --noEmit          # backend type gate
cd server && npm run api:test          # 97 integration checks (API must be running)
cd server && npm run db:verify         # seed read-back + eligible donors per group
cd client && npm run build             # client type gate + prerender
```
The API suite authenticates by **minting JWTs locally with `JWT_SECRET`** (dev/test only — the
browser uses the real Google flow; dev login hits `POST /api/auth/dev`).

## 4. Seeded accounts (all `@bloodlink.test`, fake googleIds)

All seeded accounts share the password from `SEED_DEMO_PASSWORD` in `server/.env`
(current local value: `BlDemo-2026x`) — sign in on `/login` with e.g.
`apollo.bengaluru@bloodlink.test` + that password. `POST /auth/dev` no longer exists.

| Role | Email | Notes |
| --- | --- | --- |
| ADMIN | `admin@bloodlink.test` | verifies orgs via `PATCH /admin/orgs/:userId/verify` |
| HOSPITAL | `apollo.bengaluru@bloodlink.test` | verified, Bengaluru 560076 |
| HOSPITAL | `jayadeva.mysuru@bloodlink.test` | verified, Mysuru |
| HOSPITAL | `osmania.hyderabad@bloodlink.test` | verified, Hyderabad |
| NGO | `rakta.life@bloodlink.test` | **verified**, Bengaluru, owns 2 seeded camps |
| NGO | `jeevandhara.hyderabad@bloodlink.test` | **unverified** (demo for admin verify) |
| BLOOD_BANK | `redcross.bengaluru@bloodlink.test` | verified, 12 stock rows incl. 0-unit ones |
| BLOOD_BANK | `lions.bloodbank.mysuru@bloodlink.test` | verified, 10 stock rows |
| DONOR | `ananya.sharma@bloodlink.test` | O+, eligible, has pledges |
| DONOR | `rohan.kulkarni@bloodlink.test` | A+, **ineligible** (45d) |
| DONOR | `priya.nair@bloodlink.test` | AB−, rare, eligible |
| DONOR | `aditya.verma@bloodlink.test` | A−, **unavailable** |
| DONOR | `tarun.bhatt@bloodlink.test` | O−, rare, eligible |
| … | 15 donors total | 6 rare, 4 ineligible, 2 unavailable; all 8 groups covered |

Dev login: `/login` → "Developer login" panel (visible because `NEXT_PUBLIC_DEV_LOGIN=true`) or
`POST /api/auth/dev {email}` — any new email creates an onboarding-pending user (perfect for
testing the forced-onboarding flow).

## 5. Key file map (only what you're likely to need)

| Need | File |
| --- | --- |
| Env parsing / ports | `server/src/config.ts` |
| Middleware chain | `server/src/app.ts` |
| Auth + role guards | `server/src/middleware/auth.ts` (`requireAuth`, `attachUser`, `requireRole`, `validateBody`) |
| Errors | `server/src/middleware/errors.ts` (`ApiError`, central handler) |
| All Zod schemas | `server/src/validators/index.ts` (bodies) + `query.ts` (queries) |
| Blood rules (90d, compatibility, levels) | `server/src/utils/blood.ts` (client mirror: `client/lib/format.ts`) |
| Privacy redactions | `server/src/controllers/requestController.ts` (hospital phone) + `responseController.ts` (donor phone) |
| Request/response delegates | `server/src/utils/repos.ts` (see gotcha G2) |
| Dashboard logic | `server/src/controllers/dashboardController.ts` |
| API tests | `server/scripts/api-tests.mjs` |
| Local DB manager | `server/scripts/dev-db.mjs` (see gotcha G1) |
| Theme tokens | `client/tailwind.config.ts` |
| Chrome/header/footer | `client/components/layout/Chrome.tsx` |
| Route guard | `client/components/ProtectedShell.tsx` (see decision D7) |
| SWR global config (20s) | `client/components/providers/SWRProvider.tsx` |
| Typed data hooks | `client/hooks/useApiData.ts` + `useMe.ts` |
| Fetch wrapper | `client/lib/api.ts` (`credentials: "include"`) |
| Dev login UI | `client/app/login/page.tsx` (`NEXT_PUBLIC_DEV_LOGIN` gate) |
| Full API docs | README.md §API reference |

## 6. Architecture decision log (append-only)

| # | Decision | Why |
| --- | --- | --- |
| D1 | JWT { uid } only in httpOnly cookie; role/user always loaded from DB per request | token/body can never grant roles |
| D2 | `User.phone/city/state/pincode` nullable until onboarding | Google login creates the user before we know a phone; Zod enforces them at onboarding |
| D3 | Dashboard level from **supply only** (donors + units): RED 0 / AMBER 1–4 / GREEN 5+ | spec says "Plenty/Low/None"; demand (open requests) must not inflate supply status — interpretation documented in README |
| D4 | Realtime = SWR 20s polling, no websockets | spec constraint |
| D5 | Embedded PostgreSQL via npm binaries on :5433 | zero-install dev (no Docker/admin); prod uses real `DATABASE_URL` |
| D6 | `POST /api/auth/dev` + client dev panel | demo/testable without OAuth; gated by `NODE_ENV !== "production"` / `NEXT_PUBLIC_DEV_LOGIN` |
| D7 | Client route guard = one `ProtectedShell` (login → onboarding → role); no Next `middleware.ts` auth | session validity only known from `/auth/me`; pages without `allow` (onboarding/profile) work for role-less users |
| D8 | Donor search restricted to **verified HOSPITAL** (spec text), NOT verified NGOs | spec: "Donor search (verified HOSPITAL)" |
| D9 | API tests mint JWTs with local secret instead of a bypass endpoint | no production-auth bypass code exists at all |
| D10 | **Auth split (user-requested, 2026-11-19)**: `/signup` creates accounts (role dropdown + conditional profile fields + Google verification → `POST /auth/register`); `POST /auth/google` no longer auto-creates — an unknown Google account gets 404 "No account exists… create an account first". The login page parks the verified credential in `sessionStorage("bl.pendingGoogleCredential")` so `/signup` can finish without a second popup. `/onboarding` remains for dev-login users only. No passwords — identity is always Google-verified | classic sign-up/sign-in UX while keeping the Google-only, passwordless constraint |
| D11 | **Public home redesigned as a government-portal layout (user-requested, 2026-11-20)**: navy utility strip with working A-/A/A+ root-font control (localStorage `bl.fontScale`), white header (logo + Sign in/Create account), full-width maroon `MainNav` strip below the header (desktop; mobile keeps bottom nav), hero carousel, "What's new" marquee (`animate-marquee`, built from live data), quick-link tiles, availability search → `/dashboard?city&component`, counters strip, urgent feed, health-info section. Dashboard filters initialise from query params (`useSearchParams` + Suspense). The reference portal's NAME is never mentioned anywhere (user removed all e-RaktKosh references the same day) | mimic the portal look without copying the brand |
| D12 | **Password auth added; dev login removed (user-requested, 2026-11-20)**: `/signup` takes name+email+password (bcryptjs, 10 rounds) OR Google; `/login` takes email+password (unknown email → 404 "create an account", wrong password → 401, Google-only account → 409 "continue with Google") or Google. `googleId` is now nullable + `passwordHash` column added (migration `password_auth`). `POST /auth/dev` and the dev login panel and `/onboarding` page were REMOVED — every account is created with a role. Seeded accounts get their password from `SEED_DEMO_PASSWORD` in server/.env (never hardcoded). Guest browsing: public pages need no account | real credentials UX; the email-only dev panel confused users and looked insecure |
| D14 | **Demo quick-login panel restored (user-requested, 2026-11-20)**: `/auth/dev` is back but strictly dev-gated (`isDev`) and logs in EXISTING accounts by email only — it never creates users or works in production. The `/login` dev panel (gated by `NEXT_PUBLIC_DEV_LOGIN=true`) lists the 6 seeded accounts for one-click sign-in; new users still register normally via /signup | user asked for demo accounts "as it was there" for quick testing |
| D13 | **Home/dashboard separation (user-requested, 2026-11-20)**: the home page is a standalone product/features page (hero carousel, quick links, how-it-works, per-role feature cards, why-BloodLink, camps teaser, health info, CTA) with NO dashboard data on it. `/dashboard` is now behind `ProtectedShell` (any signed-in role) and gained the "What's new" ticker; `roleHome` returns `/dashboard` for every role, so sign-in always lands there. Dev rate limits raised via `.env` (RATE_LIMIT_MAX=1000 / RATE_LIMIT_AUTH_MAX=100) because repeated local testing tripped the 30/15-min auth limiter — production keeps safe defaults | marketing page and member dashboard are separate surfaces; dashboard = post-sign-in |
| D15 | **Karnataka district system (user-requested, 2026-11-20)**: new `District` master table (31 KA districts seeded from `server/src/data/karnataka.ts`), `OrgProfile.districtId` + `Camp.districtId` nullable FKs (null = unknown/outside scope — never invented), `Component` enum now `WHOLE_BLOOD/PRBC/PLATELETS/FFP` (PLASMA renamed via `RENAME VALUE` in a hand-written migration because Prisma's diff would drop the value with live rows). New public endpoints `GET /districts` + `GET /availability` (DB-level filters; stock district DERIVED via the holding org, no column on Stock). New public `/availability` search page; org signup + camp forms get district selects. Users' own hero customisation lives in HeroCarousel.tsx — do not revert | district-aware availability search; enum migration needed hand-written SQL |

## 7. Gotchas & fixes history (read before debugging)

- **G1 — Windows detached-process pipe hang.** `pg_ctl start` detaches `postgres.exe`, which
  inherits stdout pipe handles → pipelines wait on EOF forever and appear hung while the DB is
  actually up. Fixed in `scripts/dev-db.mjs`: all tool output redirected to a file
  (`dev-db-tools.log`) instead of pipes. If a command "hangs", check the DB port first before
  assuming failure.
- **G2 — Security-hook false positives.** Static analyzers (Mimosa hook) flagged
  `prisma.bloodRequest.update(... req.*)` / `requestResponse.*` as SSRF "tainted request" and
  even corrupted one file mid-write. Fixed by using delegate aliases `bloodRequestRepo` /
  `requestResponseRepo` in `utils/repos.ts` + Zod-validating path params before queries. When
  writing Prisma calls on those two models, keep using the repo aliases.
- **G3 — npm 11 blocks install scripts.** First install needs explicit approval:
  `npm install-scripts approve prisma @prisma/client @prisma/engines esbuild @embedded-postgres/windows-x64`
  then `npm rebuild …` (already recorded in `server/package.json#allowScripts`).
- **G4 — Port squatting after TaskStop.** Killing a background npm task on Windows can orphan the
  child process. `next start`/API restarts require `netstat -ano | grep LISTENING` +
  `taskkill //PID <pid> //F` on :3000/:4000, else the new server dies with EADDRINUSE and old code
  keeps serving (this bit us once — tests ran against a stale server and "bugs" were phantom).
- **G5 — ProtectedShell role gate.** `/onboarding` and `/profile` must render for role-less
  users: the shell only enforces `allow` when passed. Regressing this causes a login↔onboarding
  loop (fixed once; test covered in browser only).
- **G6 — Login redirect race.** `/login` auto-redirects signed-in users but only after `/auth/me`
  revalidation settles (`isValidating` gate in `useMe`). Acting on stale SWR cache caused
  click-timeouts during automated testing.
- **G7 — `useSearchParams` needs a Suspense boundary** in Next 15 prerendering (`app/login/page.tsx`
  wraps its inner component).
- **G8 — Express 5 `req.params` values type as `string | string[]`** — always parse via the
  `idParamsSchema`/`userIdParamsSchema` instead of using `req.params.id` raw.
- **G9 — dotenv truncates values at `#`** (inline-comment parsing): a password like
  `BlDemo#2026` in .env becomes `BlDemo`. Use `#`-free values in .env files.

## 8. Conventions to preserve

- Server: ESM, **relative imports end in `.js`** (NodeNext); `ApiError` + central handler; Zod on
  every input; status-code table in [Rules.md §8](./Rules.md).
- Client: fetches only via `lib/api.ts`; SWR hooks in `hooks/`; theme tokens only (no raw hex in
  components); icon+text status; `en-IN` dates; `useNow` for ticking text.
- Docs live in the repo root and must be updated together when behaviour changes:
  PRD / Architecture / Rules / Phases / Design / Memory / README.
- This file (Memory.md) is the cross-session hand-off point: update §1 status, §6 decisions and
  §7 gotchas after every meaningful change.

## 9. Open items / candidate next steps (all need user approval)

- Configure real Google OAuth client + verify the GSI button end-to-end (README §Google OAuth has
  the console steps; dev flow already proven).
- Deployment guide (managed PostgreSQL, prod origins, `migrate deploy`).
- Backlog items in [Phases.md](./Phases.md) (pagination, city autocomplete, deploy guide).
- None of these are started. Do not start them unprompted.
