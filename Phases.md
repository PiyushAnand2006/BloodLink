# BloodLink — Build Phases

AI assistants: **build one phase fully, update [Memory.md](./Memory.md), then stop and wait for
the user to say "next".** A phase is complete only when its *done-criteria* all pass.

Related: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Rules.md](./Rules.md) · [Design.md](./Design.md) · [Memory.md](./Memory.md)

---

## Phase 0 — Environment & scaffold ✅
**Objective**: runnable workspace before any feature code.
- `server/` package.json (ESM), `tsconfig.json` (strict, NodeNext), `.gitignore`s, root README stub
- Zero-install dev database: `scripts/dev-db.mjs` + `@embedded-postgres/windows-x64` (port 5433,
  data in `server/.pgdata`, loopback trust auth, dev only)
- `.env` + `.env.example` with every variable from the spec

**Done when**: `npm run db:start` boots PostgreSQL and prints the connection URL.

## Phase 1 — Prisma schema, migration, seed ✅
**Objective**: the complete data layer.
- All 6 enums + 7 models (User/DonorProfile/OrgProfile/Stock/Camp/BloodRequest/RequestResponse),
  unique constraints, cascades, indexes
- `prisma migrate dev --name init` applied
- `prisma/seed.ts`: 1 admin, 3 verified hospitals, 2 NGOs (1 unverified), 2 blood banks,
  15 donors (rare / ineligible / unavailable mix) across Bengaluru–Mysuru–Hyderabad,
  32 stock rows (incl. zero-unit), 8 requests (6 OPEN/1 FULFILLED/1 CLOSED), 6 responses, 3 camps —
  all dates relative to "now"
- `scripts/verify-seed.ts` read-back check

**Done when**: `npm run db:migrate && npm run db:seed && npm run db:verify` all pass with the
expected counts (23/15/7/32/3/8/6).

## Phase 2 — Express setup, Google auth, JWT, role guards ✅
**Objective**: secure API skeleton.
- `src/app.ts` chain: helmet → credentialed CORS (exact CLIENT_URL) → JSON body → cookie-parser →
  rate limiters → `/api` router → 404 → central error handler
- `config.ts` Zod env validation (fail fast); `prisma.ts` singleton; Express `Request.user` typing
- `POST /auth/google` (verifyIdToken → upsert → cookie), `POST /auth/dev` (dev-only),
  `POST /auth/logout`, `GET /auth/me`
- `requireAuth` (DB-backed user), `attachUser` (optional), `requireRole`, `validateBody`

**Done when**: `/health` responds; `/auth/me` is 401 without a cookie and returns the user with
one; role-less users get the "Complete onboarding" guard.

## Phase 3 — All REST routes ✅
**Objective**: every endpoint in [PRD.md §5](./PRD.md) with validation + ownership.
- Profile (onboarding once-only), donor (eligibility computed), stock (unique combo, 409s),
  camps (public + `mine`), requests (filters, urgency sort, `mine` owner view, status transitions),
  responses (pledge/duplicate-409/owner listing/phone matrix/DONATED rules/withdraw),
  donor search (verified hospital only), dashboard summary (8 tiles + levels + rare banner), admin verify
- Privacy redactions implemented server-side; `ApiError` everywhere; path-param Zod schemas

**Done when**: `server/scripts/api-tests.mjs` passes **97/97** against the running API.

## Phase 4 — Tailwind theme, layout, shared components ✅
**Objective**: the design system (see [Design.md](./Design.md)).
- All tokens in `tailwind.config.ts`; Inter via `next/font`; globals.css base styles + focus rings
- `AppChrome`: maroon utility bar, white header (drop logo, role-aware nav, auth area), maroon
  footer with the exact disclaimer, mobile bottom nav
- UI kit: Button/Spinner/PageSpinner, Badge (+Urgency/RequestStatus/ResponseStatus/Verified),
  Card/EmptyState, Field/Input/Select/Textarea/Toggle, Modal, ConfirmButton, TimeBits (TimeAgo +
  Countdown), Logo, icon set
- `ProtectedShell` + `SWRProvider` (global 20s polling) + `lib/api.ts` + typed hooks

**Done when**: `client` builds; chrome renders on every page; no raw hex or ad-hoc fetches.

## Phase 5 — Auth pages, onboarding, profile ✅
**Objective**: identity journey.
- `/login`: real GSI button when configured; dev panel (seeded accounts + arbitrary new email)
  when `NEXT_PUBLIC_DEV_LOGIN=true`; redirect by role
- `/onboarding`: 3-step wizard (role → contact → role-specific), Zod mirror of server rules
- `/profile`: editable account fields, donor/org summary cards, verification state, delete account

**Done when**: a brand-new email is forced through onboarding and lands on its role home;
edits persist (verified in browser + API tests).

## Phase 6 — Dashboard, requests list, camps ✅
**Objective**: the public product surface.
- `/dashboard`: filters (debounced city, component), 8 tiles with strips, rare banner, emergency
  feed with pledge flow, camps strip, "Updated Xs ago"
- `/requests`: full filter bar (group/component/urgency/status/city), pledge cards with inline
  message box, myResponseStatus chips
- `/requests/[id]`: detail, hospital card (phone per privacy), compatibility chips, pledge panel
- `/camps`: upcoming/past sections, city filter

**Done when**: tiles match `db:verify` counts; anon sees no phones; pledging works from the feed.

## Phase 7 — Role dashboards ✅
**Objective**: every role's workspace.
- `/donor`: availability toggle, eligibility card ("Eligible from …"), "I donated today", details form
- `/my-responses`: statuses, decline/re-pledge/withdraw, DONATED locked
- `/hospital/requests` (+ `/new`, `/[id]`): CRUD, status buttons, responder console (phone reveal,
  Mark donated), edit modal, delete confirm
- `/hospital/donors`: search form, rare-first results table with tel: links (verification-gated)
- `/org/stock`: stock table with add/edit/delete modals
- `/org/camps` (NGO): camp CRUD with group-needed chips

**Done when**: the full acceptance chain (hospital → pledge → phone → DONATED → FULFILLED) passes
in the browser, and stock edits appear on the dashboard within one 20s poll.

## Phase 8 — Documentation ✅
**Objective**: hand-off quality docs.
- Root README: quick start, Google OAuth console steps, env reference, API list, theme rationale
- This file, plus PRD/Architecture/Rules/Design/Memory

**Done when**: a fresh machine can go from clone → running system following the README only.

---

## Backlog (not committed — requires user approval first)

These are **out of scope** per [PRD.md](./PRD.md) unless the user explicitly opts in:
- Deploy guide (Vercel/Render + managed PostgreSQL + prod OAuth origins)
- Optional: pagination for large lists, city autocomplete from seed data
- Optional: export/print of hospital request sheets

**Current status: Phases 0–8 all complete. See [Memory.md](./Memory.md) for the exact verified
state and how to run everything.**
