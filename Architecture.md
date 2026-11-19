# BloodLink — Architecture

Related: [PRD.md](./PRD.md) · [Design.md](./Design.md) · [Rules.md](./Rules.md) · [Phases.md](./Phases.md) · [Memory.md](./Memory.md)

---

## 1. System overview

```
┌───────────────────────────┐          ┌──────────────────────────────┐
│  client (Next.js 15)      │          │  server (Express 5 API)      │
│  http://localhost:3000    │          │  http://localhost:4000       │
│                           │          │                              │
│  App Router pages         │  fetch   │  /api routes                 │
│  SWR (20s polling)  ──────┼─JSON────▶│  ├ auth      ├ profile      │
│  React Hook Form + Zod    │ cookies  │  ├ donor     ├ donors       │
│  Tailwind theme           │ include  │  ├ stock     ├ camps        │
│                           │          │  ├ requests  ├ responses    │
│  Google Identity Services │          │  ├ dashboard ├ admin       │
│  (ID token on /login)     │          │  middleware: auth/roles/     │
└───────────────────────────┘          │  validation/errors/rate-limit│
        │ ID token                     └──────────────┬───────────────┘
        ▼                                             │ Prisma ORM
┌───────────────────────────┐          ┌──────────────▼───────────────┐
│ accounts.google.com       │  verify  │  PostgreSQL (:5433 local)    │
│ (public, https only)      │◀─────────┤  bloodlink database          │
└───────────────────────────┘ google-  │  (Prisma migrations/seed)    │
                                       └──────────────────────────────┘
                                       auth-library
```

- **Realtime = polling**: every SWR key refetches every 20 s (`SWRProvider`). No websockets.
- **Sessions**: httpOnly `bloodlink_token` JWT cookie (7d, SameSite=Lax, `secure` in prod).
  `localhost:3000 → localhost:4000` is same-site, so Lax cookies flow with `credentials: "include"`.

## 2. Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Client | Next.js 15 (App Router), React 19 | All pages are client components driven by SWR |
| Styling | Tailwind CSS 3.4 | All tokens in `client/tailwind.config.ts` |
| Data (client) | SWR 2 | Global `fetcher` + 20s `refreshInterval` |
| Forms | React Hook Form 7 + `@hookform/resolvers` + Zod | Client mirrors server validation |
| API | Node.js + **Express 5** (ESM, `"type": "module"`) | TS compiled/run via tsx |
| Validation | Zod 3 | Bodies via `validateBody`, queries via `parseQuery` |
| Auth | Google Identity Services + `google-auth-library` | ID token → `verifyIdToken` → upsert → JWT cookie (`jsonwebtoken`) |
| DB | PostgreSQL + **Prisma 6** | Migrations + seed in `server/prisma/` |
| Dev DB | `@embedded-postgres/windows-x64` binaries | `npm run db:start` → port 5433, loopback trust auth (dev only) |
| Security | helmet, cors, cookie-parser, express-rate-limit | Global 300/15min, auth 30/15min (env-tunable) |
| Tests | Node script `server/scripts/api-tests.mjs` | 97 integration checks; client `next build` = type gate |

## 3. Runtime topology (this machine)

| Port | Process | Start |
| --- | --- | --- |
| 3000 | `next start` (production build) or `next dev` | `cd client && npm start` / `npm run dev` |
| 4000 | `tsx src/index.ts` / `tsx watch src/index.ts` | `cd server && npm run dev` |
| 5433 | project-local PostgreSQL (`server/.pgdata`) | `cd server && npm run db:start` |

## 4. Auth flow

```
Browser                        Express                          Google
  │ SIGN UP (/signup) — role dropdown + conditional profile fields, then either:
  │ 2a. "Create account":      POST /api/auth/register-email
  │    │ { name, email, password, role, profile… } → 409 if email taken
  │    │ → bcrypt-hashed passwordHash → create User WITH role + profile → cookie
  │ 2b. "Continue with Google": POST /api/auth/register { credential, role, profile… }
  │    │ verifyIdToken → 409 if googleId/email already registered → create user
  │ SIGN IN (/login) — either:
  │ 3a. email + password:      POST /api/auth/login
  │    │ unknown email → 404 "No account exists… create an account first"
  │    │ wrong password → 401 · Google-only account → 409 "continue with Google"
  │ 3b. Google:                POST /api/auth/google { credential }
  │    │ verifyIdToken → findUnique by googleId
  │    │   not found → 404 → login page parks the credential in sessionStorage
  │    │             and links to /signup (no second popup needed)
  │ ◀── Set-Cookie bloodlink_token (httpOnly, 7d, JWT { uid }) ──
  │ 4. client refetches GET /api/auth/me → role home
  │    (donor /donor, hospital /hospital/requests, org /org/stock)
```

Every request: `requireAuth` verifies the cookie, loads the user **from the DB**, and attaches
`req.user` (token holds only `uid`). `attachUser` does the same but optional, for public
endpoints that are richer when logged in (request feed/detail).

Public pages (home, requests, camps) are fully browsable without an account — the **main
dashboard (`/dashboard`) requires sign-in** (any role), and protected consoles redirect guests to
`/login`. The home page is a standalone product/features page (carousel, how-it-works, per-role
features, health info) with no dashboard data on it.

## 5. Data model (Prisma)

```
User 1:1 DonorProfile          (role DONOR)
User 1:1 OrgProfile            (role NGO | BLOOD_BANK | HOSPITAL; isVerified flag)
User 1:n Stock                 (unique org+group+component)
User 1:n Camp                  (NGO only; BloodGroup[] scalar list)
User 1:n BloodRequest          (role HOSPITAL; "HospitalRequests" relation)
BloodRequest 1:n RequestResponse
User 1:n RequestResponse       (unique requestId+responderId)
```

Enums: `Role(DONOR,NGO,BLOOD_BANK,HOSPITAL,ADMIN)`, `BloodGroup(8)`, `Component(3)`,
`Urgency(3)`, `RequestStatus(OPEN,FULFILLED,CLOSED)`, `ResponseStatus(PLEDGED,DONATED,DECLINED)`.

Key rules encoded in the schema:
- `User.role/phone/city/state/pincode` are **nullable until onboarding**; Zod enforces them for
  every role once onboarded (Google creates the user before we know a phone).
- All child rows `onDelete: Cascade` → `DELETE /profile` or request delete cleans up everything.
- Indexes for dashboard/search paths (`User.city`, `Stock(bloodGroup,component)`,
  `BloodRequest(status,bloodGroup,component)`, `hospitalId`, `DonorProfile(bloodGroup,isAvailable)`…).

## 6. API surface (grouped)

| Module | Endpoints |
| --- | --- |
| Auth | `POST /auth/google` (Google sign-in) · `POST /auth/register` (Google sign-up) · `POST /auth/register-email` (email+password sign-up) · `POST /auth/login` (email+password sign-in) · `POST /auth/logout` · `GET /auth/me` |
| Profile | `PUT /profile/onboarding` · `GET/PUT/DELETE /profile` |
| Donor | `GET/PUT /donor/me` · `PATCH /donor/me/availability` |
| Stock | `GET /stock/mine` · `POST /stock` · `PUT/DELETE /stock/:id` (NGO, BLOOD_BANK) |
| Camps | `GET /camps?city=&date=[&mine=true]` · `POST/PUT/DELETE /camps/:id` (NGO) |
| Requests | `GET /requests[?filters&mine=true]` · `GET /requests/:id` · `POST /requests` · `PUT /requests/:id` · `PATCH /requests/:id/status` · `DELETE /requests/:id` |
| Responses | `POST /requests/:id/responses` · `GET /requests/:id/responses` · `GET /responses/mine` · `PATCH /responses/:id` · `DELETE /responses/:id` |
| Donor search | `GET /donors?bloodGroup=&city=&pincode=&rareOnly=true` (verified HOSPITAL) |
| Dashboard | `GET /dashboard/summary?city=&component=` |
| Admin | `PATCH /admin/orgs/:userId/verify` |

Error shape: `{ "error": { "message", "details?" } }`. Status codes: 400 validation,
401 no/invalid session, 403 role/ownership, 404 not found or not owner, 409 conflict
(duplicate pledge/stock, closed request, illegal transition), 429 rate-limited, 500 masked.

## 7. Folder structure (as built)

```
bloodlink/
├── PRD.md · Architecture.md · Rules.md · Phases.md · Design.md · Memory.md · README.md
├── client/
│   ├── app/                      # App Router
│   │   ├── layout.tsx            # Inter font + SWRProvider + AppChrome
│   │   ├── page.tsx              # landing
│   │   ├── dashboard/ requests/[id]/ camps/ login/ onboarding/ profile/
│   │   ├── donor/ my-responses/
│   │   ├── hospital/requests{,/new,/id}/ hospital/donors/
│   │   └── org/stock/ org/camps/
│   ├── components/
│   │   ├── ProtectedShell.tsx    # client route guard (login → onboarding → role check)
│   │   ├── layout/Chrome.tsx     # UtilityBar + AppHeader + AppFooter + BottomNav
│   │   ├── dashboard/            # BloodGroupTile, SummaryFilters, RareBanner, RequestCard, CampsStrip
│   │   ├── requests/RequestForm.tsx
│   │   └── ui/                   # Button/Spinner, Badge, Card, forms(+Toggle), Modal,
│   │                             # ConfirmButton, TimeBits, PageHeader, Logo, icons
│   ├── hooks/                    # useMe, useNow, useApiData (typed SWR wrappers)
│   └── lib/                      # api.ts (fetch wrapper), constants.ts, format.ts, googleAuth.ts
└── server/
    ├── prisma/                   # schema.prisma, migrations/, seed.ts
    ├── scripts/                  # dev-db.mjs, api-tests.mjs, verify-seed.ts
    └── src/
        ├── index.ts              # listen + graceful shutdown
        ├── app.ts                # middleware chain
        ├── config.ts             # zod-validated env
        ├── prisma.ts  types.ts
        ├── middleware/           # auth.ts (requireAuth/attachUser/requireRole/validateBody),
        │                         # errors.ts (ApiError + central handler), rateLimiter.ts
        ├── validators/           # index.ts (bodies), query.ts (query strings)
        ├── controllers/          # auth, profile, donor, donorsSearch, stock, camp,
        │                         # request, response, dashboard, admin
        ├── routes/               # one file per module + index.ts mount
        └── utils/                # jwt, cookies, blood.ts (compat/eligibility/level),
                                  # sanitize.ts, repos.ts (bloodRequestRepo/requestResponseRepo)
```

## 8. Key design decisions

| Decision | Rationale |
| --- | --- |
| JWT in httpOnly cookie (not localStorage) | XSS-safe session; CORS `credentials` needed anyway |
| Role read from DB per request | Token/body can never grant a role; onboarding transition is instantly effective |
| Polling (SWR 20s), not websockets | Spec constraint; simplest reliable "live" dashboard |
| Eligibility computed on read | No cron jobs; last-donation edits instantly reclassify a donor |
| Dashboard level from supply only | "Plenty/Low/None" must describe availability; demand (open requests) shown separately |
| `POST /auth/dev` + client dev panel | Demo/testable without real Google credentials; hard-gated by `NODE_ENV !== "production"` and `NEXT_PUBLIC_DEV_LOGIN` |
| Project-local PostgreSQL via npm binaries | Zero-install reproducibility (no Docker/admin needed); prod points `DATABASE_URL` at a real instance |
| `utils/repos.ts` delegate aliases | Keeps controllers tidy; see Memory.md gotcha about analyzers + `prisma.bloodRequest.*` |
| Server redacts phones; client never re-derives | Privacy matrix is enforced in one place (controllers) |

## 9. Cross-cutting concerns

- **Config**: `src/config.ts` parses `process.env` with Zod at boot; fail-fast with readable errors.
- **Validation**: `validateBody(schema)` middleware for bodies; `parseQuery(schema, req.query)` in controllers; path params via `idParamsSchema` / `userIdParamsSchema`.
- **Errors**: controllers `throw new ApiError(status, message, details?)` → single `errorHandler` (maps Prisma P2002→409, P2025→404, P2003→400; hides internals in prod).
- **Rate limiting**: `apiLimiter` (global) + `authLimiter` (token minting).
- **Client API discipline**: all fetches go through `lib/api.ts` (`credentials: "include"`, typed `ApiError`); SWR hooks in `hooks/useApiData.ts`; route protection in `ProtectedShell` (login → onboarding → role home).

Full details, rationale and gotchas: [Memory.md](./Memory.md).
