# BloodLink — Rules for AI assistants

These rules constrain how an AI (or any contributor) may change this codebase. They exist so the
project stays consistent across chat sessions and tools. **If a task seems to require breaking a
rule, stop and ask the user first.**

Related: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Phases.md](./Phases.md) · [Design.md](./Design.md) · [Memory.md](./Memory.md)

---

## 1. Scope rules

1. The product is a **CRUD coordination platform**. Do NOT add: payments, chat/messaging, maps or
   geolocation APIs, OTP/SMS/email, ML features, websockets, file uploads, or admin dashboards
   beyond the seeded verify action. If the user asks, flag the conflict with [PRD.md §3](./PRD.md).
2. Work **one phase at a time** as defined in [Phases.md](./Phases.md). Finish a phase completely
   (no placeholders, no TODO-passing code), update [Memory.md](./Memory.md), then stop and wait
   for the user to say "next".
3. Do not invent endpoints, models or pages that are not in [PRD.md](./PRD.md) without explicit
   user approval.
4. Do not refactor beyond the current task. Match existing style; leave neighbouring code alone.

## 2. Approved libraries (allow-list)

Backend (`server/`):
- `express@5`, `cors`, `helmet`, `cookie-parser`, `express-rate-limit`
- `@prisma/client` + `prisma` (v6)
- `zod@3` (v3 API: `z.string().email()`, `safeParse`, etc.)
- `google-auth-library`, `jsonwebtoken`
- `bcryptjs` (password hashing — never store plain passwords)
- `dotenv`
- Dev: `typescript@5` (strict, module NodeNext), `tsx`, `@types/*`,
  `@embedded-postgres/<platform>` (local dev DB binaries only)

Client (`client/`):
- `next@15` (App Router), `react@19`
- `tailwindcss@3.4` (v3 config-file style — **not** Tailwind v4 CSS-first)
- `swr@2`
- `react-hook-form@7` + `@hookform/resolvers` + `zod@3`

**Nothing else without explicit approval.** Before adding any dependency: name it, justify it,
and get user consent. Do not introduce state libraries (Redux/Zustand), UI kits (MUI/antd),
ORM alternatives, test frameworks, or CSS-in-JS.

Explicitly avoid: Firebase, Supabase, Axios (use `lib/api.ts`), Moment.js (use `lib/format.ts`),
`nanoid`/`uuid` (Prisma cuid), class-based React, styled-components.

## 3. Security & privacy rules (hard)

1. **Never trust the client.** Role and userId come only from the DB row loaded by `requireAuth`;
   never from request body, headers, or token payloads.
2. **Validate everything** with Zod: bodies (`validateBody`), query strings (`parseQuery`),
   path params (`idParamsSchema` / `userIdParamsSchema`) before they touch Prisma.
3. **Secrets live only in env files** (`.env`, gitignored). Never hardcode credentials, tokens,
   passwords, or real phone numbers in source, seed, examples or tests. `.env.example` carries
   placeholders only.
4. **Privacy matrix is law** (see [PRD.md §6](./PRD.md)): donor phone only to verified hospitals
   (search) or the request owner after PLEDGED/DONATED; hospital phone only to logged-in
   responders on OPEN requests; declined responders anonymous. Redaction happens **server-side**
   in controllers; never rely on the client to hide data.
5. Sessions are httpOnly cookies (`sameSite: lax`, `secure` in production). Never move the JWT to
   localStorage or expose it to client JS.
6. CORS allows exactly `CLIENT_URL` (plus no-origin clients); never use wildcard with credentials.
7. Only authenticated, appropriately-rolled users reach mutating endpoints; public GETs stay
   read-only and redacted.
8. SQL is always parameterised via Prisma. Never build SQL strings, never use `$queryRaw` with
   interpolation.

## 4. Backend rules

1. Controllers `throw new ApiError(status, message, details?)`; only the central
   `errorHandler` in `middleware/errors.ts` writes error responses. No `try/catch` that swallows
   errors; no `res.status(500)` outside the handler.
2. Status code discipline: 400 validation · 401 unauthenticated · 403 wrong role/ownership/
   unverified · 404 not found **or not yours** (never confirm existence to strangers) ·
   409 duplicates/illegal transitions · 429 rate limit.
3. Zod schemas live in `server/src/validators/` (bodies in `index.ts`, queries in `query.ts`);
   client-side schemas mirror them but the server is the authority.
4. Business constants (90-day gap, compatibility map, level thresholds) live only in
   `server/src/utils/blood.ts` and are mirrored for display in `client/lib/format.ts`. Keep the
   two in sync.
5. New SQL access goes through the existing delegates (or `utils/repos.ts` aliases for
   `bloodRequest` / `requestResponse`). See Memory.md gotcha G2 before renaming models.
6. ESM everywhere: `"type": "module"` + relative imports **must** end in `.js` under NodeNext.
7. Timestamps: keep `createdAt`/`updatedAt` from Prisma; never trust client-supplied creation
   times.

## 5. Frontend rules

1. All network calls go through `client/lib/api.ts` (`credentials: "include"`, `ApiError`).
   Never call `fetch` directly in a component.
2. Server state = SWR (hooks in `hooks/useApiData.ts`); form state = React Hook Form with a Zod
   resolver; no other state library, no `useEffect`-fetching.
3. Route protection uses `components/ProtectedShell.tsx` (login → onboarding → role). Do not
   implement ad-hoc redirects per page; do not add Next.js `middleware.ts` auth (the session is a
   cookie the client must validate via `/auth/me`).
4. Never render another user's phone number from client-side logic; the API already redacts —
   render what you get.
5. Polling stays at 20 s globally (`SWRProvider`); do not add per-component intervals except
   `useNow` for display ticking.
6. UI text in English; icons come from `components/ui/icons.tsx`; colours from Tailwind tokens —
   no raw hex in components.
7. Time-relative UI (`TimeAgo`, `Countdown`) must use `useNow()` to avoid hydration mismatches.

## 6. Data & seed rules

1. Seed data is fake: `seed-…` googleIds, `*.bloodlink.test` emails, clearly synthetic phones.
   Never seed real-looking personal data.
2. Seed is destructive-by-design (wipes tables) and dev-only; it must stay runnable with
   `npm run db:seed` at any time.
3. Schema changes require a Prisma migration (`prisma migrate dev --name …`) — never hand-edit
   `migrations/` SQL, never `db push` on shared databases.

## 7. Testing rules (definition of done)

A change is "done" only when:
1. `cd server && npx tsc --noEmit` passes;
2. API behaviour is covered: extend `server/scripts/api-tests.mjs` for new/changed endpoints and
   run the suite (server running) — all checks green, no skipping;
3. If client code changed: `cd client && npm run build` passes (strict TS + prerender);
4. If UI changed: verify the affected flow in the browser (dev login panel) before claiming done;
5. [Memory.md](./Memory.md) is updated (status, gotchas, decisions).

## 8. Error handling conventions

- API errors: `ApiError` only; messages are user-readable, never leak stack traces or SQL.
- Client: `ApiError` carries `status` + optional `details`; forms map `details[].path` where
  useful; global spinner/empty/error states come from `Card`/`EmptyState`/`PageSpinner`.
- Expected failures are 4xx with a message; anything 5xx is a bug — log it server-side
  (`console.error("[unhandled error]")`) and mask the response in production.
- The dev login endpoint and embedded DB must never run in production paths (`NODE_ENV` gates).

## 9. Code style

- TypeScript strict; `noUnusedLocals`/`noUnusedParameters` on (server). No `any` unless
  unavoidable and commented.
- Naming: files `camelCase.ts`; components `PascalCase.tsx`; Prisma models PascalCase singular;
  route files `xxxRoutes.ts`; controllers `xxxController.ts`.
- Comments explain *why*, not *what*; match the existing comment density.
- Commits (if asked): small, imperative subject, only after tests pass. Never commit `.env`,
  `.pgdata/`, `node_modules/`, `.next/`.

## 10. Explicit AI don'ts

- Don't skip, weaken or delete existing tests to make a run pass.
- Don't "fix" failing privacy/security checks by loosening the assertion.
- Don't reformat whole files or reorder imports unrelated to the change.
- Don't add config files (`eslint`, `prettier`, `husky`…) without approval.
- Don't upgrade major versions of any dependency without approval.
- Don't leave background processes (DB/API/client) unexplained — report what is running and on
  which port (see Memory.md §Runtime).
- Don't answer questions about the codebase by re-reading everything — check [Memory.md](./Memory.md)
  first; it is kept current precisely to save that cost.
- After any meaningful change: update [Memory.md](./Memory.md) (status, decisions, gotchas).
