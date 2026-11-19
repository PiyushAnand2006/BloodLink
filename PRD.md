# BloodLink — Product Requirements Document (PRD)

| | |
| --- | --- |
| **Product** | BloodLink — Emergency Blood Donor, NGO and Blood Bank Coordination Platform |
| **Version** | 1.0 |
| **Status** | Implemented (all requirements below are built and verified) |
| **Owner** | Project spec ("Master Prompt") |
| **Related docs** | [Architecture.md](./Architecture.md) · [Design.md](./Design.md) · [Rules.md](./Rules.md) · [Phases.md](./Phases.md) · [Memory.md](./Memory.md) |

---

## 1. Problem

When blood stock runs out, hospitals and families scramble on WhatsApp for donors. National
portals publish blood-bank stock but **do not connect a hospital with individual donors and NGOs
during an emergency**. There is no single place where a hospital's urgent need, nearby willing
donors, NGO-run camps, and live blood-bank stock meet.

## 2. Product goal

One platform where:

- **Hospitals** post emergency blood requests (group, component, units, deadline, urgency).
- **Donors** pledge to specific requests and keep their availability/eligibility up to date.
- **NGOs** list stock, organise donation camps and respond to requests.
- **Blood banks** publish live stock per blood group and component.
- **Everyone** sees a live, public dashboard of availability per blood group.

## 3. Non-goals (explicit scope guardrails)

BloodLink is a **coordination** platform only. The following are out of scope:

- Payments, virtual payment, rewards
- Chat / messaging
- Maps / geolocation APIs (city + pincode text filters are the only "location" concept)
- OTP / SMS / email notifications
- ML (matching scores, demand prediction)
- Medical eligibility beyond the 90-day whole-blood gap rule (screening is a hospital's job)

> Rule of thumb: **CRUD operations only.** If a feature needs anything beyond create / read /
> update / delete with validation and ownership checks, it is out of scope.

## 4. Target users

| Persona | Who they are | Primary needs |
| --- | --- | --- |
| **Donor** (individual) | Willing blood donor, 18+, any city | Be reachable only when available & eligible; see urgent needs nearby; manage pledges; control availability with one toggle |
| **Hospital** (staff) | Verified hospital account | Post urgent requests in seconds; see pledgers' phone numbers only after a pledge; mark donations; search eligible donors; keep contact details private otherwise |
| **NGO** | Voluntary organisation | Publish stock, organise camps, pledge on behalf of drives |
| **Blood bank** | Licensed centre | Publish live stock per group/component; respond to requests |
| **Admin** (platform) | Seeded operator | Verify organisations (unlocks hospital donor search) |
| **Public visitor** | Anyone | See live availability per group without an account |

## 5. Functional requirements

Status legend: ✅ implemented & tested.

### 5.1 Accounts & onboarding
- **FR-A1** ✅ Two registration paths on `/signup`: **email + password** (bcrypt-hashed, min 8 chars) or **Google** (ID token verified server-side → httpOnly JWT cookie). Role dropdown (Donor / NGO / Blood bank / Hospital) with conditional profile fields; Google users need no password.
- **FR-A2** ✅ **Sign-in** (`/login`) verifies the account: email+password (`POST /auth/login` — unknown email → "create an account" message; wrong password rejected; Google-only accounts told to continue with Google) or Google (`POST /auth/google` — unregistered Google accounts get the same create-account message, with verification carried over to /signup).
- **FR-A3** ✅ Roles chosen once at registration; after sign-in users land on the **main dashboard**. **Guest browsing**: home (product/features page), requests and camps are fully public — no account required; the dashboard and personal consoles redirect guests to sign-in.
- **FR-A4** ✅ Registration collects full name, 10-digit Indian mobile + city/state/pincode for every role, plus donor fields (blood group, DOB, gender, optional last donation) or org fields (name, reg no., address, contact person).
- **FR-A5** ✅ Profile view/edit (name, phone, city, state, pincode); account deletion cascades all owned data.
- **FR-A6** ✅ Admin verifies organisations (`PATCH /admin/orgs/:userId/verify`); verification gates donor search.

### 5.2 Donor
- **FR-D1** ✅ Donor profile with blood group, DOB, gender, availability toggle, rare flag, last donation date.
- **FR-D2** ✅ **Eligibility is computed, never stored**: eligible iff never donated or last donation ≥ 90 days ago; UI shows "Eligible from \<date\>" otherwise.
- **FR-D3** ✅ Availability toggle (PATCH) — only available **and** eligible donors count on the dashboard and appear in hospital search.
- **FR-D4** ✅ Donors pledge on OPEN requests (one pledge per request), can decline/withdraw, cannot alter a response marked DONATED.
- **FR-D5** ✅ Donors see a hospital's phone number on OPEN requests (logged-in responder).

### 5.3 Hospital
- **FR-H1** ✅ Post emergency requests: patient identifier, blood group, component (WHOLE_BLOOD/PLATELETS/PLASMA), units, urgency (CRITICAL/URGENT/NORMAL), deadline (`neededBy`, must be future), city, pincode, note.
- **FR-H2** ✅ Public feed defaults to OPEN requests, sorted CRITICAL-first then soonest deadline.
- **FR-H3** ✅ Owner-only edit, status transitions (OPEN/FULFILLED/CLOSED with reopen), delete (cascades responses).
- **FR-H4** ✅ Responder console: list of responders with role, group, city, message; **donor phone revealed only after PLEDGED/DONATED**; declined responders stay anonymous.
- **FR-H5** ✅ Hospital marks individual responses DONATED and the request FULFILLED.
- **FR-H6** ✅ **Verified** hospitals can search donors (group/city/pincode/rareOnly); only available + eligible donors are returned, **with phone numbers**.

### 5.4 NGO & blood bank
- **FR-O1** ✅ Stock CRUD per (blood group, component) with units 0–500; unique per org; changes are visible on the public dashboard within 20 s.
- **FR-O2** ✅ NGO-only camp CRUD (title, venue, city, pincode, date, times, description, needed groups); public camps listing filterable by city/date; "upcoming" presentation.

### 5.5 Dashboard (public)
- **FR-B1** ✅ `GET /dashboard/summary?city=&component=` returns 8 tiles: `{ bloodGroup, donorsAvailable, unitsAvailable, openRequests, level }`.
- **FR-B2** ✅ Level from **supply** (donors + units): RED = 0, AMBER = 1–4, GREEN = 5+. Open requests are displayed as demand, never inflate supply status.
- **FR-B3** ✅ Rare-donor banner (available + eligible donors in negative groups), respecting the city filter.
- **FR-B4** ✅ Emergency request feed (urgency badge, units, component, hospital, city, countdown, "I can donate") and upcoming-camps strip on the dashboard.
- **FR-B5** ✅ Auto-refresh every 20 s with a visible "Updated Xs ago" indicator (SWR polling; no websockets). The dashboard is a **signed-in** surface — the public home page describes the product and links to it.
- **FR-B6** ✅ **District-wise availability search** (public `/availability`): filters for district (all 31 Karnataka districts, "All Districts" default), blood group and component (Whole blood / PRBC / Platelets / Plasma-FFP); results list each inventory row with institution name, district + address (derived from the institution's registration), units and last-updated timestamp. Filtering happens in the database; registered inventory is explicitly not presented as real-time availability.

## 6. Privacy requirements (non-negotiable)

| Data | Who may see it |
| --- | --- |
| Donor phone | Verified hospitals via donor search · the request owner after that donor PLEDGED/DONATED |
| Hospital phone | Logged-in responders (DONOR/NGO/BLOOD_BANK), only while the request is OPEN |
| Declined responder identity | Visible as "declined" to the owner, **without** phone |
| Anything | Never the anonymous public |

Phone numbers are never rendered by public pages; anonymity is enforced server-side (client has no way to opt out of the redaction).

## 7. Non-functional requirements

- **Realtime**: 20-second polling; no websockets, no push infrastructure.
- **Accessibility**: WCAG AA contrast; status is always icon + text (never colour alone); keyboard focus visible; switch/aria roles on toggles; responsive with a mobile bottom nav.
- **Performance**: single-instance demo scale (<200 rows per table); all list endpoints capped (take 100–200).
- **Security**: server-side validation on every input; role/ownership checks on every mutation; parameterised queries (Prisma); rate limiting; helmet; secrets only from env.
- **Data**: seed data uses fake googleIds and `*.bloodlink.test` emails — no real PII.

## 8. Acceptance criteria (all verified)

1. ✅ Google login works and a new user is forced through onboarding.
2. ✅ Phone and profile details are saved and editable.
3. ✅ Hospital creates a request → donor pledges → hospital sees the donor's phone → marks DONATED → marks request FULFILLED.
4. ✅ NGO and blood-bank stock changes reflect on the dashboard within 20 s.
5. ✅ Phone numbers are never exposed to unauthorized users.
6. ✅ Every entity supports create, read, update and delete.
