# BloodLink

**Emergency Blood Donor, NGO and Blood Bank Coordination Platform**

When blood stock runs out, hospitals and families scramble on WhatsApp. National portals like
national portals show blood-bank stock, but they don't connect a hospital with individual donors and
NGOs during an emergency. **BloodLink does both**: hospitals post emergency requests, donors /
NGOs / blood banks respond, and a live dashboard shows availability per blood group.

---

## Table of contents

1. [Screens & features](#screens--features)
2. [Tech stack](#tech-stack)
3. [Project layout](#project-layout)
4. [Quick start (local)](#quick-start-local)
5. [Google OAuth setup (console steps)](#google-oauth-setup-console-steps)
6. [Environment variables](#environment-variables)
7. [Database, migrations & seed](#database-migrations--seed)
8. [Testing](#testing)
9. [API reference](#api-reference)
10. [Design & theme rationale](#design--theme-rationale)
11. [Security & privacy model](#security--privacy-model)
12. [Business rules](#business-rules)

---

## Screens & features

| Area | Routes | Highlights |
| --- | --- | --- |
| Public | `/`, `/dashboard`, `/requests`, `/camps`, `/login` | Live availability dashboard (8 blood-group tiles, 20s polling), emergency feed with countdowns, camps listing |
| Auth | `/login`, `/onboarding` | Google Sign-In; one-time onboarding picks the role (DONOR / NGO / BLOOD_BANK / HOSPITAL) |
| Profile | `/profile` | Editable phone + contact details, org verification status, account deletion |
| Donor | `/donor`, `/my-responses` | Availability toggle, computed 90-day eligibility ("Eligible from …"), pledge management |
| Hospital | `/hospital/requests`, `/hospital/requests/new`, `/hospital/requests/[id]`, `/hospital/donors` | Request CRUD with status flow, responder console (phone revealed after pledge, mark DONATED), verified-only donor search |
| NGO / Blood bank | `/org/stock`, `/org/camps` (NGO) | Stock CRUD per group+component, camp CRUD |

## Tech stack

| Layer | Technology |
| --- | --- |
| Client | Next.js 15 (App Router) · React 19 · Tailwind CSS 3 · SWR (20s polling realtime) · React Hook Form + Zod |
| API | Node.js + Express 5 (REST/JSON) · Zod validation · helmet · CORS(credentialed) · express-rate-limit |
| Database | PostgreSQL + Prisma ORM |
| Auth | Google Identity Services → ID token verified by `google-auth-library` → httpOnly JWT cookie |

Realtime is **polling only** (SWR `refreshInterval: 20000`) — no websockets. Scope is strictly
CRUD: no payments, chat, maps, OTP or ML.

## Project layout

```
bloodlink/
  client/                 # Next.js app
    app/                  # App Router pages
    components/           # layout, ui primitives, dashboard/request/stock/camp widgets
    hooks/                # useMe + typed SWR data hooks
    lib/                  # api client, constants/types, formatting, Google auth loader
  server/                 # Express API
    src/
      routes/             # 10 route modules mounted under /api
      controllers/        # auth, profile, donor, stock, camp, request, response, donors, dashboard, admin
      middleware/         # requireAuth / attachUser / requireRole / validateBody, errors, rate limit
      validators/         # Zod schemas (bodies + query strings)
      utils/              # jwt, cookies, blood compatibility & eligibility, sanitizers, repos
      prisma/…            # schema.prisma, migrations/, seed.ts (also under server/prisma)
    scripts/              # dev-db.mjs (local PostgreSQL), api-tests.mjs, verify-seed.ts
  README.md
```

## Quick start (local)

```bash
# 1. API + database
cd server
npm install
npm run db:start     # boots a project-local PostgreSQL on :5433 (no install / no Docker needed)
npm run db:migrate   # applies Prisma migrations
npm run db:seed      # loads the demo dataset
npm run dev          # API on http://localhost:4000

# 2. Client (new terminal)
cd client
npm install
npm run dev          # http://localhost:3000
```

`npm run db:start` uses binaries shipped by the `@embedded-postgres/windows-x64` npm package into
`server/.pgdata` (gitignored) — nothing is installed system-wide, no admin rights required, and
local auth is loopback `trust` (dev only). **For production, always use a real PostgreSQL instance**
and point `DATABASE_URL` at it. Stop the local DB with `npm run db:stop`.

Don't want the embedded DB? Start your own PostgreSQL (or Docker) and edit `DATABASE_URL` in
`server/.env` instead — every other command stays the same.

The client ships with a **developer login panel** on `/login` (enabled via
`NEXT_PUBLIC_DEV_LOGIN=true`): one-click sign-in as the seeded demo accounts, plus a box to
simulate a brand-new Google user. The real Google button renders automatically once
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured.

## Google OAuth setup (console steps)

1. Open <https://console.cloud.google.com/> → create (or pick) a project.
2. **APIs & Services → OAuth consent screen**
   - User type: *External*, fill app name/support email, add scopes `openid`, `email`, `profile`,
     add your own account as a test user (while unverified).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `http://localhost:3000` (add your deployed client origin later)
   - **Authorized redirect URIs**: not required for Google Identity Services button flow (token
     comes back in JS) — leave empty.
4. Copy the **Client ID** (`….apps.googleusercontent.com`) into:
   - `server/.env` → `GOOGLE_CLIENT_ID`
   - `client/.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
5. Restart both dev servers. The real Google button replaces the notice on `/login`.

How the flow works: **/signup** creates the account — pick a role (Donor / NGO / Blood bank /
Hospital), fill your name + email + password and the profile fields, then **Create account**
(`POST /api/auth/register-email`, bcrypt-hashed password). Prefer Google? Click **Continue with
Google** on the same page — the ID token + form go to `POST /api/auth/register` and no password is
needed. **/login** accepts email + password (`POST /api/auth/login`) or Google
(`POST /api/auth/google`): an unknown email gets "No account exists… create an account first"
(with the Google verification carried over to /signup), a wrong password is rejected, and
Google-registered accounts are told to continue with Google. Sessions are signed **httpOnly JWT
cookies** (7 days).

> All seeded accounts share the password configured via `SEED_DEMO_PASSWORD` in `server/.env`
> (dev only) — e.g. sign in as `apollo.bengaluru@bloodlink.test` to try the hospital console.
> Public pages (home, dashboard, requests, camps) are browsable without any account.

## Environment variables

`server/.env` (see `server/.env.example`):

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (4000) |
| `NODE_ENV` | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Signing secret for session cookies (`openssl rand -hex 48`) |
| `JWT_EXPIRES_IN` | Cookie lifetime (7d) |
| `GOOGLE_CLIENT_ID` | OAuth client used to verify ID tokens |
| `SEED_DEMO_PASSWORD` | Password given to all seeded accounts by `npm run db:seed` (dev only) |
| `CLIENT_URL` | Exact client origin allowed by credentialed CORS |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_AUTH_MAX` | Rate limits per 15 min (global / auth) |

`client/.env.local` (see `client/.env.example`): `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_DEV_LOGIN`.

> Real credentials live only in gitignored `.env` files — never in source.

## Database, migrations & seed

```bash
npm run db:migrate    # create/apply migrations (dev)
npm run db:deploy     # apply migrations (CI/prod)
npm run db:seed       # reset + load demo data
npm run db:verify     # read-back counts + eligible donors per group
npm run db:studio     # Prisma Studio GUI
npm run db:reset      # drop + re-apply + re-seed
```

**Seed data** (fake `seed-…` googleIds, `*.bloodlink.test` emails — no real credentials):
1 admin · 3 verified hospitals (Bengaluru, Mysuru, Hyderabad) · 2 NGOs (1 pending verification to
demo admin approval) · 2 blood banks · 15 donors across the three cities (6 rare, 4 currently
ineligible, 2 unavailable) · 32 stock rows (incl. zero-unit rows so RED tiles appear) · 8 requests
(6 OPEN / 1 FULFILLED / 1 CLOSED, mixed urgency) · 6 responses · 3 upcoming camps. Dates are
generated relative to "now", so the demo always looks live.

Schema highlights: enums `Role, BloodGroup, Component, Urgency, RequestStatus, ResponseStatus`;
`User.role` is nullable until onboarding; one-to-one `DonorProfile` / `OrgProfile`; `Stock` unique
per `(org, group, component)`; `RequestResponse` unique per `(request, responder)` with cascade
deletes everywhere.

## Testing

```bash
# API integration suite (97 checks) — server must be running
cd server && npm run api:test

# Seed verification
cd server && npm run db:verify

# Client type-check + production build
cd client && npm run build
```

The API suite covers: auth & onboarding flows, profile CRUD (incl. account deletion), donor
eligibility math, stock CRUD + org ownership, camp CRUD + NGO ownership, request CRUD + filters +
status transitions, the full pledge → phone-reveal → DONATED → FULFILLED chain, declined-anonymity,
withdrawal rules, donor-search permissions (verified hospitals only), dashboard levels/filters,
admin verification, and all privacy rules. It mints JWTs with the local `JWT_SECRET` (dev only).

## API reference

Base URL `/api`. Errors: `{ "error": { "message", "details?" } }`. Session = httpOnly JWT cookie.

**Auth**
| Method & path | Auth | Notes |
| --- | --- | --- |
| `POST /auth/google` | – | `{ credential }` Google ID token → upsert user + cookie |
| `POST /auth/dev` | – | dev builds only — `{ email }` demo login |
| `POST /auth/logout` | – | clears cookie |
| `GET /auth/me` | any | current user + profiles |

**Profile** — `PUT /profile/onboarding` (one-time role+details), `GET /profile`,
`PUT /profile` (name/phone/city/state/pincode), `DELETE /profile` (cascades everything).

**Donor** — `GET /donor/me` (with computed `eligible`, `eligibleFrom`), `PUT /donor/me`,
`PATCH /donor/me/availability`.

**Stock** (NGO, BLOOD_BANK) — `GET /stock/mine`, `POST /stock` (409 on duplicate combination),
`PUT /stock/:id`, `DELETE /stock/:id` (owner-only).

**Camps** — `GET /camps?city=&date=` (public; `mine=true` for the owning NGO), `POST /camps`,
`PUT /camps/:id`, `DELETE /camps/:id` (NGO owner-only).

**Requests** — `GET /requests` (filters `bloodGroup, component, city, pincode, urgency, status`;
defaults to OPEN; sorted CRITICAL-first; `mine=true` for the owning hospital with responder counts;
includes `myResponseStatus` for logged-in responders), `GET /requests/:id` (public detail with
`hospitalPhone` per the privacy matrix below), `POST /requests` (HOSPITAL), `PUT /requests/:id`,
`PATCH /requests/:id/status`, `DELETE /requests/:id` (owner).

**Responses** — `POST /requests/:id/responses` (DONOR/NGO/BLOOD_BANK on OPEN; 409 on duplicate),
`GET /requests/:id/responses` (owning hospital; phone per rules), `GET /responses/mine`,
`PATCH /responses/:id` (responder → `PLEDGED`/`DECLINED`, owner hospital → `DONATED`),
`DELETE /responses/:id` (responder withdraw; blocked after DONATED).

**Donor search** — `GET /donors?bloodGroup=&city=&pincode=&rareOnly=true` (**verified HOSPITAL
only**; returns only available + eligible donors, with phone).

**Dashboard** — `GET /dashboard/summary?city=&component=` → `{ summary[8], rareDonorsAvailable,
filters, updatedAt }`. Each tile: `{ bloodGroup, donorsAvailable, unitsAvailable, openRequests,
level }` where level = **RED** (0 supply) / **AMBER** (1–4) / **GREEN** (5+), computed from supply
(donors + units) — demand never makes supply look plentiful. Other components default to
`WHOLE_BLOOD`.

**Admin** — `PATCH /admin/orgs/:userId/verify` `{ isVerified }` (ADMIN only).

## Design & theme rationale

The design goal is a **trustworthy, government-grade health portal** — not a
flashy consumer app:

- **Crimson `#C62828`** (primary) is reserved for blood and urgency: CTAs, active nav, urgency
  highlights. Blood is the subject, so the accent must read as clinical-red, not as marketing.
- **Dark maroon `#8E0000`** frames the page (top utility bar + footer), a convention of Indian
  government/health portals that signals "official channel" without shouting.
- **Slate navy `#1F2A44`** for headings/links — calm, credible, high contrast on white.
- **Flat surfaces, 6px radii, subtle shadows, generous spacing** — density comes from typography
  and whitespace, not decoration, which keeps data tiles scannable under stress.
- **Status colours** success `#2E7D32`, warning `#F9A825`, danger `#C62828`, info `#1565C0` are
  used with **icon + text, never colour alone** (WCAG): tiles show a strip with ✓ Plenty /
  ⚠ Low / ✕ None; badges pair icons with labels; the emergency feed ranks CRITICAL first and adds
  countdown text ("in 5h 12m" / "Overdue").
- **Accessibility**: AA contrast pairs throughout (e.g. dark text on warning-yellow), visible
  focus rings, `role="switch"` availability toggle, aria-labels on icon buttons, fully responsive
  with a 5-item bottom nav on mobile.
- All tokens live in `client/tailwind.config.ts` (single source of truth); Inter (600 for
  headings) via `next/font`.

## Security & privacy model

- **Server-side truth only**: role/userId always come from the DB via the verified JWT cookie —
  never from the request body. Zod validates every body and query string; ids are validated before
  queries.
- **Phone privacy matrix** (enforced in controllers, covered by tests):

  | Data | Who can see it |
  | --- | --- |
  | Donor phone | Verified hospitals (donor search) · request owner after that donor PLEDGED/DONATED |
  | Hospital phone | Logged-in donors/NGOs/blood banks, on OPEN requests only |
  | Declined responder | Stays anonymous to the hospital (no phone) |

- httpOnly + SameSite=Lax cookie, `secure` in production; CORS restricted to the exact
  `CLIENT_URL` with credentials; helmet on; rate limiting (global + tighter on auth);
  centralized error handler (no stack leaks in prod); Prisma parameterisation throughout.
- `DELETE /profile` cascades: donor profiles, stock, camps, requests and responses.

## Business rules

- Phone: 10-digit Indian mobile (`^[6-9]\d{9}$`) required for every role at onboarding.
- **Donor eligibility** is computed, never stored: eligible if never donated, or last donation ≥
  90 days ago; UI shows "Eligible from \<date\>" otherwise. Only available **and** eligible donors
  count on the dashboard and appear in hospital search.
- **Compatibility** (whole blood): O−→O− · O+→O+,O− · A−→A−,O− · A+→A+,A−,O+,O− · B−→B−,O− ·
  B+→B+,B−,O+,O− · AB−→AB−,A−,B−,O− · AB+→everyone. Platelets/plasma: exact group only. The
  request detail page shows compatible groups as chips.
- Dashboard levels: RED = 0 total supply, AMBER = 1–4, GREEN = 5+ (supply = donors + units).
- Roles are chosen once at onboarding and never changed afterwards; ADMIN is a seeded role only.

---

**Disclaimer**: BloodLink is a coordination platform. Donors must be screened by a hospital or
blood bank. Availability shown here is indicative and must be confirmed with the concerned blood
bank before transfusion decisions.
