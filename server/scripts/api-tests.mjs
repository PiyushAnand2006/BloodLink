/**
 * BloodLink — API integration test suite.
 *
 * Exercises every endpoint against a RUNNING server (default
 * http://localhost:4000/api) using the seeded database. Authentication is
 * simulated by minting JWTs with the server's JWT_SECRET (dev/test only —
 * the browser uses the real Google flow).
 *
 * Run:  npm run api:test          (server must be up: `npm run dev`)
 * Env:  TEST_API_URL, JWT_SECRET, DATABASE_URL (from .env)
 *
 * Covers: auth, onboarding, profile CRUD, donor endpoints, stock CRUD +
 * ownership, camps CRUD + filters, requests CRUD + filters + status,
 * responses (pledge/donate/decline/withdraw), donor search permissions,
 * dashboard summary levels/filters, admin verify, and the privacy rules.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const BASE = process.env.TEST_API_URL ?? "http://localhost:4000/api";
const SECRET = process.env.JWT_SECRET ?? "";
if (!SECRET) {
  console.error("JWT_SECRET missing — run with the server's .env loaded");
  process.exit(1);
}

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, extra = "") {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function call(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Cookie: `bloodlink_token=${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function tokenFor(user) {
  return jwt.sign({ uid: user.id }, SECRET, { expiresIn: "1h" });
}

const emails = {
  admin: "admin@bloodlink.test",
  apollo: "apollo.bengaluru@bloodlink.test",
  jayadeva: "jayadeva.mysuru@bloodlink.test",
  osmania: "osmania.hyderabad@bloodlink.test",
  rakta: "rakta.life@bloodlink.test",
  jeevan: "jeevandhara.hyderabad@bloodlink.test",
  redcross: "redcross.bengaluru@bloodlink.test",
  lions: "lions.bloodbank.mysuru@bloodlink.test",
  ananya: "ananya.sharma@bloodlink.test",
  rohan: "rohan.kulkarni@bloodlink.test",
  priya: "priya.nair@bloodlink.test",
  aditya: "aditya.verma@bloodlink.test",
};

const users = {};
const tokens = {};

async function loadUsers() {
  for (const [key, email] of Object.entries(emails)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`Seed user missing: ${email} — run npm run db:seed`);
    users[key] = user;
    tokens[key] = tokenFor(user);
  }
}

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

async function run() {
  await loadUsers();

  /* ============================== Public / dashboard ============================== */
  console.log("\n— Dashboard & public endpoints");
  let r = await call("/dashboard/summary");
  check("dashboard summary is public (200)", r.status === 200);
  check("dashboard returns 8 blood-group tiles", r.data?.summary?.length === 8);
  const opos = r.data?.summary?.find((t) => t.bloodGroup === "O_POS");
  const aneg = r.data?.summary?.find((t) => t.bloodGroup === "A_NEG");
  check("O+ supply is GREEN (2 donors + 44 units)", opos?.level === "GREEN", JSON.stringify(opos));
  check("A− supply is AMBER (0 donors + 4 Red Cross units)", aneg?.level === "AMBER" && aneg?.unitsAvailable === 4 && aneg?.donorsAvailable === 0, JSON.stringify(aneg));
  check("rare donor banner count = 4", r.data?.rareDonorsAvailable === 4, String(r.data?.rareDonorsAvailable));

  r = await call("/dashboard/summary?city=Mysuru&component=WHOLE_BLOOD");
  const mysOpos = r.data?.summary?.find((t) => t.bloodGroup === "O_POS");
  const mysAneg = r.data?.summary?.find((t) => t.bloodGroup === "A_NEG");
  check("city filter: Mysuru O+ units = 11 (Lions only)", mysOpos?.unitsAvailable === 11, JSON.stringify(mysOpos));
  check("city filter: Mysuru O+ donors = 1 (Manoj)", mysOpos?.donorsAvailable === 1, JSON.stringify(mysOpos));
  check("city filter: Mysuru A− is RED", mysAneg?.level === "RED");

  r = await call("/requests");
  check("public requests feed defaults to OPEN", r.status === 200 && r.data?.requests?.every?.((x) => x.status === "OPEN"));
  check("feed is sorted CRITICAL first", r.data?.requests?.[0]?.urgency === "CRITICAL");
  check("anon feed has no hospital phone", r.data?.requests?.every?.((x) => x.hospitalPhone === null));

  r = await call("/requests?bloodGroup=A_POS&city=Bengaluru");
  check(
    "filter bloodGroup+city works",
    r.data?.requests?.length >= 1 && r.data.requests.every((x) => x.bloodGroup === "A_POS" && x.city === "Bengaluru"),
  );

  r = await call("/camps");
  check("public camps list (3 seeded)", r.status === 200 && r.data?.camps?.length === 3, String(r.data?.camps?.length));
  r = await call("/camps?city=Hyderabad");
  check("camps city filter", r.data?.camps?.length === 1 && r.data.camps[0].city === "Hyderabad");

  const feedId = (await call("/requests")).data?.requests?.[0]?.id;
  r = await call(`/requests/${feedId}`);
  check("public request detail (200)", r.status === 200 && r.data?.request?.id === feedId);
  check("anon detail: hospital phone hidden", r.data?.request?.hospitalPhone === null);
  check("anon detail: responsesCount present", typeof r.data?.request?.responsesCount === "number");

  /* ============================== Auth ============================== */
  console.log("\n— Auth");
  r = await call("/auth/me");
  check("auth/me without token → 401", r.status === 401);
  r = await call("/auth/me", { token: tokens.ananya });
  check("auth/me with token returns donor", r.status === 200 && r.data?.user?.role === "DONOR");
  check("auth/me hides googleId", !("googleId" in (r.data?.user ?? {})));

  r = await call("/auth/dev", { method: "POST", body: { email: "x@bloodlink.test" } });
  check("dev-login endpoint removed → 404", r.status === 404);

  // Sign-in no longer auto-creates accounts; registration is a separate endpoint.
  r = await call("/auth/google", { method: "POST", body: { credential: "f".repeat(120) } });
  check("auth/google with invalid token → 401", r.status === 401);
  r = await call("/auth/register", { method: "POST", body: { role: "DONOR" } });
  check("register without Google credential → 400", r.status === 400);
  r = await call("/auth/register", {
    method: "POST",
    body: {
      credential: "f".repeat(120),
      role: "DONOR",
      phone: "9812300000",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      bloodGroup: "B_POS",
      dateOfBirth: "1995-05-05",
      gender: "MALE",
    },
  });
  check("register with invalid Google token → 401", r.status === 401);
  r = await call("/auth/register", {
    method: "POST",
    body: {
      credential: "f".repeat(120),
      role: "HOSPITAL",
      phone: "9812300000",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
  });
  check("register missing org fields → 400", r.status === 400);

  /* ============== Registration & login (email + password) ============== */
  console.log("\n— Registration & login (email + password)");
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "";
  check("SEED_DEMO_PASSWORD available to tests", demoPassword.length >= 8);

  r = await call("/auth/login", {
    method: "POST",
    body: { email: "ghost@bloodlink.test", password: "whatever1" },
  });
  check("login unknown email → 404 with create hint", r.status === 404 && /create an account/i.test(r.data?.error?.message ?? ""));

  r = await call("/auth/login", { method: "POST", body: { email: emails.ananya, password: "wrongpass1" } });
  check("login wrong password → 401", r.status === 401);

  r = await call("/auth/login", { method: "POST", body: { email: emails.ananya, password: demoPassword } });
  check("seed user signs in with email + password", r.status === 200 && r.data?.user?.role === "DONOR");

  r = await call("/auth/register-email", {
    method: "POST",
    body: {
      name: "Pass User",
      email: "pass.user@bloodlink.test",
      password: demoPassword,
      role: "DONOR",
      phone: "9812340000",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      bloodGroup: "A_POS",
      dateOfBirth: "1993-03-03",
      gender: "MALE",
    },
  });
  check("register-email creates donor (role + phone saved)", r.status === 201 && r.data?.user?.role === "DONOR" && r.data?.user?.phone === "9812340000");
  const passUserId = r.data?.user?.id;

  r = await call("/auth/register-email", {
    method: "POST",
    body: {
      name: "Pass User 2",
      email: "pass.user@bloodlink.test",
      password: demoPassword,
      role: "DONOR",
      phone: "9812340000",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      bloodGroup: "A_POS",
      dateOfBirth: "1993-03-03",
      gender: "MALE",
    },
  });
  check("register-email duplicate email → 409", r.status === 409);

  r = await call("/auth/register-email", {
    method: "POST",
    body: {
      name: "Weak Pass",
      email: "weak.pass@bloodlink.test",
      password: "short",
      role: "DONOR",
      phone: "9812340001",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      bloodGroup: "A_POS",
      dateOfBirth: "1993-03-03",
      gender: "MALE",
    },
  });
  check("register-email weak password → 400", r.status === 400);

  r = await call("/auth/register-email", {
    method: "POST",
    body: {
      name: "Admin Try",
      email: "admin.try@bloodlink.test",
      password: demoPassword,
      role: "ADMIN",
      phone: "9812340002",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
  });
  check("ADMIN role rejected at registration", r.status === 400);

  r = await call("/auth/register-email", {
    method: "POST",
    body: {
      name: "Bad Phone",
      email: "bad.phone@bloodlink.test",
      password: demoPassword,
      role: "DONOR",
      phone: "99001",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      bloodGroup: "A_POS",
      dateOfBirth: "1993-03-03",
      gender: "MALE",
    },
  });
  check("invalid phone rejected (400)", r.status === 400);

  r = await call("/auth/login", {
    method: "POST",
    body: { email: "pass.user@bloodlink.test", password: demoPassword },
  });
  check("newly registered user can sign in", r.status === 200);
  const passToken = jwt.sign({ uid: passUserId }, SECRET, { expiresIn: "1h" });

  /* ============================== Profile ============================== */
  console.log("\n— Profile");
  r = await call("/profile", { token: passToken });
  check("GET /profile returns full profile", r.status === 200 && r.data?.user?.donorProfile?.bloodGroup === "A_POS");
  r = await call("/profile", {
    method: "PUT",
    token: passToken,
    body: { name: "Pass User", phone: "9876599999", city: "Mysuru", state: "Karnataka", pincode: "570001" },
  });
  check("PUT /profile updates phone+city", r.status === 200 && r.data?.user?.phone === "9876599999" && r.data?.user?.city === "Mysuru");
  r = await call("/profile", { method: "DELETE", token: passToken });
  check("DELETE /profile removes account", r.status === 200);
  r = await call("/auth/me", { token: passToken });
  check("deleted account token → 401", r.status === 401);

  /* ============================== Donor ============================== */
  console.log("\n— Donor");
  r = await call("/donor/me", { token: tokens.ananya });
  check("GET /donor/me → eligible (130 days ago)", r.data?.profile?.eligible === true);
  check("eligibleFrom null when already eligible", r.data?.profile?.eligibleFrom === null);
  r = await call("/donor/me", { token: tokens.rohan });
  check("rohan (45 days ago) ineligible with eligibleFrom date", r.data?.profile?.eligible === false && r.data?.profile?.eligibleFrom !== null);
  r = await call("/donor/me", { token: tokens.apollo });
  check("hospital on /donor/me → 403", r.status === 403);
  r = await call("/donor/me/availability", { method: "PATCH", token: tokens.aditya, body: { isAvailable: true } });
  check("PATCH availability toggles on", r.data?.profile?.isAvailable === true);
  await call("/donor/me/availability", { method: "PATCH", token: tokens.aditya, body: { isAvailable: false } });
  r = await call("/donor/me", { method: "PUT", token: tokens.aditya, body: { bloodGroup: "A_NEG", dateOfBirth: "1997-09-30", gender: "MALE", lastDonatedOn: new Date(Date.now() - 200 * DAY).toISOString() } });
  check("PUT /donor/me updates fields", r.data?.profile?.lastDonatedOn !== null && r.data?.profile?.eligible === true);

  /* ============================== Stock ============================== */
  console.log("\n— Stock");
  r = await call("/stock/mine", { token: tokens.rakta });
  check("GET /stock/mine lists NGO stock (5 rows)", r.data?.stock?.length === 5, String(r.data?.stock?.length));
  r = await call("/stock", { method: "POST", token: tokens.rakta, body: { bloodGroup: "A_NEG", component: "FFP", units: 3 } });
  check("POST /stock creates row", r.status === 201 && r.data?.stock?.units === 3);
  const stockId = r.data?.stock?.id;
  r = await call("/stock", { method: "POST", token: tokens.rakta, body: { bloodGroup: "A_NEG", component: "FFP", units: 5 } });
  check("duplicate stock row → 409", r.status === 409);
  r = await call(`/stock/${stockId}`, { method: "PUT", token: tokens.rakta, body: { units: 7 } });
  check("PUT /stock/:id updates units (owner)", r.data?.stock?.units === 7);
  r = await call(`/stock/${stockId}`, { method: "PUT", token: tokens.redcross, body: { units: 99 } });
  check("PUT other org's stock → 404", r.status === 404);
  r = await call("/stock", { method: "POST", token: tokens.ananya, body: { bloodGroup: "O_POS", component: "WHOLE_BLOOD", units: 1 } });
  check("donor cannot create stock (403)", r.status === 403);
  r = await call(`/stock/${stockId}`, { method: "DELETE", token: tokens.rakta });
  check("DELETE /stock/:id (owner)", r.status === 200);
  r = await call(`/stock/${stockId}`, { method: "DELETE", token: tokens.rakta });
  check("double delete → 404", r.status === 404);

  /* ============================== Districts & availability ============================== */
  console.log("\n— Districts & availability");
  r = await call("/districts");
  check("GET /districts returns all 31 Karnataka districts", r.status === 200 && r.data?.total === 31, String(r.data?.total));
  const districtsByName = Object.fromEntries(
    (r.data?.districts ?? []).map((d) => [d.name, d.id]),
  );
  const mysuruId = districtsByName["Mysuru"];
  check("district master includes Mysuru and Bengaluru Urban", Boolean(mysuruId) && Boolean(districtsByName["Bengaluru Urban"]));

  r = await call("/availability");
  check("availability lists all stock rows unfiltered", r.status === 200 && r.data?.total === 35, String(r.data?.total));
  check(
    "rows expose institution district, address and last-updated",
    (r.data?.results ?? []).every((x) => "district" in x && "address" in x && "updatedAt" in x),
  );
  const unknownDistrictRows = (r.data?.results ?? []).filter((x) => x.district === null);
  check("rows outside Karnataka keep district unknown (never invented)", unknownDistrictRows.length === 5, String(unknownDistrictRows.length));

  r = await call(`/availability?districtId=${mysuruId}`);
  check("district filter returns only that district's rows", (r.data?.results ?? []).length > 0 && r.data.results.every((x) => x.district === "Mysuru"));

  r = await call(`/availability?districtId=${mysuruId}&bloodGroup=O_POS&component=PRBC`);
  check(
    "district + group + component filters combine",
    r.data?.results?.length === 1 && r.data.results[0].units === 3 && r.data.results[0].orgName.includes("Lions"),
    JSON.stringify(r.data?.results),
  );

  r = await call("/availability?bloodGroup=AB_NEG&component=FFP");
  check("group + component combination with no matches → empty", r.status === 200 && r.data?.total === 0);

  r = await call("/availability?districtId=nonexistent123");
  check("unknown district id → empty results, never guessed", r.status === 200 && r.data?.total === 0);

  /* ============================== Camps ============================== */
  console.log("\n— Camps");
  const tomorrow = new Date(Date.now() + 2 * DAY).toISOString().slice(0, 10);
  r = await call("/camps", { method: "POST", token: tokens.rakta, body: { title: "Test Camp", venue: "Test Venue", city: "Bengaluru", districtId: districtsByName["Bengaluru Urban"], pincode: "560001", date: tomorrow, startTime: "09:00", endTime: "13:00", description: "d", bloodGroupsNeeded: ["O_POS", "A_NEG"] } });
  check("NGO creates camp", r.status === 201);
  const campId = r.data?.camp?.id;
  r = await call("/camps", { method: "POST", token: tokens.redcross, body: { title: "Bad Camp", venue: "v", city: "Bengaluru", pincode: "560001", date: tomorrow, startTime: "09:00", endTime: "13:00", bloodGroupsNeeded: ["O_POS"] } });
  check("blood bank cannot create camp (403)", r.status === 403);
  r = await call(`/camps/${campId}`, { method: "PUT", token: tokens.jeevan, body: { title: "Hijack attempt", venue: "Other Venue", city: "Hyderabad", pincode: "500001", date: tomorrow, startTime: "10:00", endTime: "12:00", bloodGroupsNeeded: ["O_POS"] } });
  check("other NGO cannot update camp (404)", r.status === 404);
  r = await call(`/camps/${campId}`, { method: "PUT", token: tokens.rakta, body: { title: "Test Camp v2", venue: "Test Venue", city: "Bengaluru", pincode: "560001", date: tomorrow, startTime: "09:00", endTime: "14:00", bloodGroupsNeeded: ["O_POS"] } });
  check("NGO updates own camp", r.data?.camp?.title === "Test Camp v2");
  r = await call("/camps", { token: tokens.rakta, method: "GET" });
  void r;
  r = await call(`/camps?mine=true`, { token: tokens.rakta });
  check("NGO mine=true lists own camps", r.data?.camps?.some?.((c) => c.id === campId));
  r = await call(`/camps?districtId=${districtsByName["Bengaluru Urban"]}`);
  check(
    "camps district filter matches venue district",
    (r.data?.camps ?? []).length >= 3 && r.data.camps.every((c) => c.districtName === "Bengaluru Urban"),
    JSON.stringify(r.data?.camps?.map((c) => c.districtName)),
  );
  r = await call(`/camps/${campId}`, { method: "DELETE", token: tokens.rakta });
  check("NGO deletes own camp", r.status === 200);

  /* ============================== Requests ============================== */
  console.log("\n— Requests");
  const neededBy = new Date(Date.now() + 12 * HOUR).toISOString();
  r = await call("/requests", { method: "POST", token: tokens.apollo, body: { patientName: "Test Patient", bloodGroup: "B_NEG", component: "WHOLE_BLOOD", units: 2, urgency: "CRITICAL", neededBy, city: "Bengaluru", pincode: "560076", note: "test" } });
  check("hospital creates request", r.status === 201 && r.data?.request?.status === "OPEN");
  const reqId = r.data?.request?.id;
  r = await call("/requests", { method: "POST", token: tokens.ananya, body: { patientName: "Nope", bloodGroup: "B_NEG", component: "WHOLE_BLOOD", units: 2, urgency: "CRITICAL", neededBy, city: "Bengaluru", pincode: "560076" } });
  check("donor cannot create request (403)", r.status === 403);
  r = await call("/requests", { method: "POST", token: tokens.apollo, body: { patientName: "Bad", bloodGroup: "B_NEG", component: "WHOLE_BLOOD", units: 2, urgency: "CRITICAL", neededBy: "2020-01-01T00:00:00Z", city: "Bengaluru", pincode: "560076" } });
  check("past neededBy rejected (400)", r.status === 400);
  r = await call("/requests?mine=true", { token: tokens.apollo });
  check("hospital mine=true lists own with respondersCount", r.data?.requests?.some?.((x) => x.id === reqId && typeof x.respondersCount === "number"));
  r = await call("/requests?mine=true", { token: tokens.rakta });
  check("NGO cannot use mine=true (403)", r.status === 403);
  r = await call(`/requests/${reqId}`, { method: "PUT", token: tokens.apollo, body: { patientName: "Test Patient v2", bloodGroup: "B_NEG", component: "WHOLE_BLOOD", units: 3, urgency: "URGENT", city: "Bengaluru", pincode: "560076", note: null } });
  check("owner updates request", r.data?.request?.units === 3 && r.data?.request?.urgency === "URGENT");
  r = await call(`/requests/${reqId}`, { method: "PUT", token: tokens.jayadeva, body: { patientName: "Hijack", bloodGroup: "B_NEG", component: "WHOLE_BLOOD", units: 3, urgency: "URGENT", city: "Mysuru", pincode: "570001" } });
  check("other hospital cannot update (404)", r.status === 404);

  /* ============================== Responses + privacy ============================== */
  console.log("\n— Responses & privacy rules");
  r = await call(`/requests/${reqId}/responses`, { method: "POST", token: tokens.ananya, body: { message: "On my way" } });
  check("donor pledges (201)", r.status === 201 && r.data?.response?.status === "PLEDGED");
  const ananyaResponseId = r.data?.response?.id;
  r = await call(`/requests/${reqId}/responses`, { method: "POST", token: tokens.ananya, body: {} });
  check("duplicate pledge → 409", r.status === 409);
  r = await call(`/requests/${reqId}/responses`, { method: "POST", token: tokens.rakta, body: {} });
  check("NGO pledges too", r.status === 201);
  const raktaResponseId = r.data?.response?.id;
  r = await call(`/requests/${reqId}/responses`, { method: "POST", token: tokens.apollo, body: {} });
  check("hospital cannot pledge (403)", r.status === 403);

  r = await call(`/requests/${reqId}/responses`, { token: tokens.apollo });
  const ananyaRow = r.data?.responses?.find((x) => x.responder.id === users.ananya.id);
  check("owner sees responses (2)", r.data?.responses?.length === 2);
  check("pledged donor phone visible to owner", ananyaRow?.responder?.phone === users.ananya.phone, JSON.stringify(ananyaRow?.responder));
  check("donor bloodGroup included", ananyaRow?.responder?.bloodGroup === "O_POS");

  r = await call(`/requests/${reqId}/responses`, { token: tokens.jayadeva });
  check("other hospital cannot view responses (403)", r.status === 403);

  r = await call(`/requests/${reqId}`, { token: tokens.ananya });
  check("responder sees hospital phone on OPEN request", r.data?.request?.hospitalPhone === users.apollo.phone, JSON.stringify(r.data?.request?.hospitalPhone));
  check("responder sees own myResponse", r.data?.request?.myResponse?.status === "PLEDGED");
  r = await call(`/requests/${reqId}`, { token: tokens.jayadeva });
  check("other hospital does NOT see hospital phone", r.data?.request?.hospitalPhone === null);
  r = await call(`/requests/${reqId}`);
  check("anon still does not see hospital phone", r.data?.request?.hospitalPhone === null);

  r = await call(`/responses/${ananyaResponseId}`, { method: "PATCH", token: tokens.apollo, body: { status: "DONATED" } });
  check("hospital marks DONATED", r.data?.response?.status === "DONATED");
  r = await call(`/responses/${ananyaResponseId}`, { method: "PATCH", token: tokens.ananya, body: { status: "DECLINED" } });
  check("responder cannot change DONATED (409)", r.status === 409);
  r = await call(`/responses/${ananyaResponseId}`, { method: "DELETE", token: tokens.ananya });
  check("cannot withdraw after DONATED (409)", r.status === 409);

  r = await call(`/responses/${raktaResponseId}`, { method: "PATCH", token: tokens.rakta, body: { status: "DECLINED" } });
  check("responder sets DECLINED", r.data?.response?.status === "DECLINED");
  r = await call(`/requests/${reqId}/responses`, { token: tokens.apollo });
  check("declined responder phone hidden from owner", r.data?.responses?.find((x) => x.responder.id === users.rakta.id)?.responder?.phone === null);
  r = await call(`/responses/${raktaResponseId}`, { method: "DELETE", token: tokens.rakta });
  check("responder withdraws declined response", r.status === 200);

  r = await call("/responses/mine", { token: tokens.ananya });
  check("GET /responses/mine lists own with request summary", r.data?.responses?.some?.((x) => x.id === ananyaResponseId && x.request?.hospitalName === "Apollo Hospitals Bengaluru"));

  // fulfilled requests stop accepting pledges and hide hospital phone
  r = await call(`/requests/${reqId}/status`, { method: "PATCH", token: tokens.apollo, body: { status: "FULFILLED" } });
  check("owner marks FULFILLED", r.data?.request?.status === "FULFILLED");
  r = await call(`/requests/${reqId}`, { token: tokens.ananya });
  check("hospital phone hidden once not OPEN", r.data?.request?.hospitalPhone === null);
  r = await call(`/requests/${reqId}/responses`, { method: "POST", token: tokens.priya, body: {} });
  check("pledge on FULFILLED request → 409", r.status === 409);
  r = await call(`/requests/${reqId}/status`, { method: "PATCH", token: tokens.apollo, body: { status: "OPEN" } });
  check("owner reopens request", r.data?.request?.status === "OPEN");

  r = await call(`/responses/mine`, { token: tokens.apollo });
  check("hospital cannot use /responses/mine (403)", r.status === 403);

  /* ============================== Donor search (verified hospitals) ============================== */
  console.log("\n— Donor search");
  r = await call("/donors?city=Bengaluru", { token: tokens.apollo });
  check("verified hospital searches donors", r.status === 200 && r.data?.donors?.length >= 3, String(r.data?.donors?.length));
  const searchNames = (r.data?.donors ?? []).map((d) => d.name);
  check("search excludes unavailable donors (Aditya)", !searchNames.includes("Aditya Verma"));
  check("search excludes ineligible donors (Rohan 45d, Divya 60d)", !searchNames.includes("Rohan Kulkarni") && !searchNames.includes("Divya Prasad"));
  check("donor phone visible to verified hospital", (r.data?.donors ?? []).every((d) => typeof d.phone === "string" && d.phone.length === 10));
  r = await call("/donors?bloodGroup=O_NEG&rareOnly=true", { token: tokens.apollo });
  check("rareOnly + bloodGroup filter (Sneha, Tarun)", (r.data?.donors ?? []).every((d) => d.bloodGroup === "O_NEG" && d.isRare) && r.data.donors.length === 2, JSON.stringify(r.data?.donors?.map?.((d) => d.name)));
  r = await call("/donors", { token: tokens.jeevan });
  check("unverified NGO → 403", r.status === 403);
  r = await call("/donors", { token: tokens.ananya });
  check("donor cannot search donors (403)", r.status === 403);
  r = await call("/donors", {});
  check("anon cannot search donors (401)", r.status === 401);

  /* ============================== Admin ============================== */
  console.log("\n— Admin");
  r = await call(`/admin/orgs/${users.jeevan.id}/verify`, { method: "PATCH", token: tokens.admin, body: { isVerified: true } });
  check("admin verifies NGO", r.status === 200 && r.data?.orgProfile?.isVerified === true);
  r = await call("/donors", { token: tokens.jeevan });
  check("even a verified NGO cannot search donors (spec: hospital-only)", r.status === 403);
  r = await call(`/admin/orgs/${users.jeevan.id}/verify`, { method: "PATCH", token: tokens.apollo, body: { isVerified: false } });
  check("hospital cannot verify orgs (403)", r.status === 403);
  r = await call(`/admin/orgs/${users.jeevan.id}/verify`, { method: "PATCH", token: tokens.admin, body: { isVerified: false } });
  check("admin un-verifies again", r.data?.orgProfile?.isVerified === false);
  r = await call(`/admin/orgs/${users.ananya.id}/verify`, { method: "PATCH", token: tokens.admin, body: { isVerified: true } });
  check("verify non-org → 404", r.status === 404);

  /* ============================== Cleanup test request ============================== */
  r = await call(`/requests/${reqId}`, { method: "DELETE", token: tokens.apollo });
  check("owner deletes request", r.status === 200);
  r = await call(`/requests/${reqId}`);
  check("deleted request gone (404)", r.status === 404);

  /* ============================== Result ============================== */
  console.log(`\n==========================================`);
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exitCode = 1;
  }
}

run()
  .catch((e) => {
    console.error("Test run crashed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
