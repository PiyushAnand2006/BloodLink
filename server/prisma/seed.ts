/**
 * BloodLink — development seed.
 *
 * Creates a complete demo dataset:
 *   • 1 admin
 *   • 3 verified hospitals   (Bengaluru, Mysuru, Hyderabad)
 *   • 2 NGOs                 (1 verified, 1 pending admin verification)
 *   • 2 verified blood banks (Bengaluru, Mysuru)
 *   • 15 donors across the three cities — a mix of rare donors, donors who
 *     are currently ineligible (donated < 90 days ago) and donors who have
 *     switched off availability
 *   • 32 stock rows (NGO + blood bank; mixed groups/components, including
 *     zero-unit rows so RED tiles appear on the dashboard)
 *   • 8 blood requests of mixed urgency (6 OPEN / 1 FULFILLED / 1 CLOSED)
 *   • 6 responses (PLEDGED / DONATED / DECLINED)
 *   • 3 upcoming camps
 *
 * All seeded accounts use fake googleIds (`seed-...`) and `*.bloodlink.test`
 * e-mail addresses — no real credentials are involved.
 *
 * Run with `npm run db:seed` (or `npx prisma db seed`).
 * Re-running wipes and recreates all data — intended for development only.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  BloodGroup,
  Component,
  Urgency,
  RequestStatus,
  ResponseStatus,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MINUTE = 60 * 1000;

const minutesAgo = (n: number) => new Date(Date.now() - n * MINUTE);
const hoursAgo = (n: number) => new Date(Date.now() - n * HOUR);
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const hoursFromNow = (n: number) => new Date(Date.now() + n * HOUR);
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  /**
   * Demo password for every seeded account — provided via SEED_DEMO_PASSWORD
   * in server/.env (never hardcoded). Seeded users can sign in with their
   * *.bloodlink.test email + this password, or via Google if they register.
   */
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error(
      "Set SEED_DEMO_PASSWORD (min 8 chars) in server/.env before seeding — see server/.env.example",
    );
  }
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  /* ------------------------------------------------------ reset tables */
  await prisma.requestResponse.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.camp.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.orgProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log("✔ existing data cleared");

  /* ------------------------------------------------------------- admin */
  await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-admin-0000000001",
      email: "admin@bloodlink.test",
      name: "BloodLink Admin",
      role: Role.ADMIN,
      phone: "9000000000",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
  });

  /* --------------------------------------------------------- hospitals */
  const apollo = await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-hospital-00000001",
      email: "apollo.bengaluru@bloodlink.test",
      name: "Apollo Hospitals Bengaluru",
      role: Role.HOSPITAL,
      phone: "9900112233",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560076",
      orgProfile: {
        create: {
          orgName: "Apollo Hospitals Bengaluru",
          regNo: "KA-HOS-2001-0117",
          address: "154/11, Bannerghatta Road, Opp. IIM, Bengaluru",
          contactPerson: "Dr. Ramesh Iyer",
          isVerified: true,
        },
      },
    },
  });

  const jayadeva = await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-hospital-00000002",
      email: "jayadeva.mysuru@bloodlink.test",
      name: "Sri Jayadeva Institute of Cardiovascular Sciences",
      role: Role.HOSPITAL,
      phone: "9820911223",
      city: "Mysuru",
      state: "Karnataka",
      pincode: "570001",
      orgProfile: {
        create: {
          orgName: "Sri Jayadeva Institute of Cardiovascular Sciences, Mysuru",
          regNo: "KA-HOS-2004-0382",
          address: "Jayadeva Marg, Nazarbad Mohalla, Mysuru",
          contactPerson: "Dr. Meera Rao",
          isVerified: true,
        },
      },
    },
  });

  const osmania = await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-hospital-00000003",
      email: "osmania.hyderabad@bloodlink.test",
      name: "Osmania General Hospital",
      role: Role.HOSPITAL,
      phone: "9731445566",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500012",
      orgProfile: {
        create: {
          orgName: "Osmania General Hospital",
          regNo: "TS-HOS-1956-0021",
          address: "Afzal Gunj, Near Nayapul, Hyderabad",
          contactPerson: "Dr. Arvind Kumar",
          isVerified: true,
        },
      },
    },
  });

  /* --------------------------------------------------------------- NGOs */
  const raktaLife = await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-ngo-0000000001",
      email: "rakta.life@bloodlink.test",
      name: "Rakta Life Foundation",
      role: Role.NGO,
      phone: "9663322110",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      orgProfile: {
        create: {
          orgName: "Rakta Life Foundation",
          regNo: "NGO-KA-2015-0231",
          address: "No. 42, 12th Main, Indiranagar, Bengaluru",
          contactPerson: "Anitha Desai",
          isVerified: true,
        },
      },
    },
  });

  const jeevanDhara = await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-ngo-0000000002",
      email: "jeevandhara.hyderabad@bloodlink.test",
      name: "Jeevan Dhara Seva Trust",
      role: Role.NGO,
      phone: "9550066778",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500001",
      orgProfile: {
        create: {
          orgName: "Jeevan Dhara Seva Trust",
          regNo: "NGO-TS-2019-1177",
          address: "3-4-101, Nampally Station Road, Hyderabad",
          contactPerson: "Suresh Babu",
          isVerified: false, // pending admin verification — demo for PATCH /admin/orgs/:userId/verify
        },
      },
    },
  });

  /* -------------------------------------------------------- blood banks */
  const redCross = await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-bloodbank-0000001",
      email: "redcross.bengaluru@bloodlink.test",
      name: "Indian Red Cross Blood Centre, Bengaluru",
      role: Role.BLOOD_BANK,
      phone: "9440012345",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      orgProfile: {
        create: {
          orgName: "Indian Red Cross Blood Centre, Bengaluru",
          regNo: "BB-KA-2012-0045",
          address: "Red Cross Bhavan, Museum Road, Bengaluru",
          contactPerson: "Mr. Girish Rao",
          isVerified: true,
        },
      },
    },
  });

  const lionsBB = await prisma.user.create({
    data: {
      passwordHash,
      googleId: "seed-bloodbank-0000002",
      email: "lions.bloodbank.mysuru@bloodlink.test",
      name: "Lions Club Blood Bank, Mysuru",
      role: Role.BLOOD_BANK,
      phone: "9538112468",
      city: "Mysuru",
      state: "Karnataka",
      pincode: "570008",
      orgProfile: {
        create: {
          orgName: "Lions Club Blood Bank, Mysuru",
          regNo: "BB-KA-2016-0092",
          address: "Vani Vilas Road, Krishnamurthypuram, Mysuru",
          contactPerson: "Mr. Prakash Jain",
          isVerified: true,
        },
      },
    },
  });

  /* ------------------------------------------------------------- donors */
  interface DonorSeedInput {
    googleId: string;
    email: string;
    name: string;
    phone: string;
    city: string;
    state: string;
    pincode: string;
    profile: {
      bloodGroup: BloodGroup;
      dateOfBirth: Date;
      gender: string;
      isAvailable: boolean;
      isRare: boolean;
      lastDonatedOn: Date | null;
    };
  }

  const donorSeeds: DonorSeedInput[] = [
    // ---- Bengaluru (7) ----
    { googleId: "seed-donor-0000000001", email: "ananya.sharma@bloodlink.test", name: "Ananya Sharma", phone: "9845012345", city: "Bengaluru", state: "Karnataka", pincode: "560034",
      profile: { bloodGroup: BloodGroup.O_POS, dateOfBirth: new Date("1994-03-12"), gender: "FEMALE", isAvailable: true, isRare: false, lastDonatedOn: daysAgo(130) } },
    { googleId: "seed-donor-0000000002", email: "rohan.kulkarni@bloodlink.test", name: "Rohan Kulkarni", phone: "9886123450", city: "Bengaluru", state: "Karnataka", pincode: "560066",
      profile: { bloodGroup: BloodGroup.A_POS, dateOfBirth: new Date("1990-07-08"), gender: "MALE", isAvailable: true, isRare: false, lastDonatedOn: daysAgo(45) } }, // ineligible, eligible in ~45 days
    { googleId: "seed-donor-0000000003", email: "priya.nair@bloodlink.test", name: "Priya Nair", phone: "9632587410", city: "Bengaluru", state: "Karnataka", pincode: "560078",
      profile: { bloodGroup: BloodGroup.AB_NEG, dateOfBirth: new Date("1996-11-02"), gender: "FEMALE", isAvailable: true, isRare: true, lastDonatedOn: daysAgo(210) } },
    { googleId: "seed-donor-0000000004", email: "karthik.menon@bloodlink.test", name: "Karthik Menon", phone: "9902773418", city: "Bengaluru", state: "Karnataka", pincode: "560095",
      profile: { bloodGroup: BloodGroup.B_POS, dateOfBirth: new Date("1988-01-25"), gender: "MALE", isAvailable: true, isRare: false, lastDonatedOn: null } },
    { googleId: "seed-donor-0000000005", email: "sneha.patil@bloodlink.test", name: "Sneha Patil", phone: "9741923580", city: "Bengaluru", state: "Karnataka", pincode: "560068",
      profile: { bloodGroup: BloodGroup.O_NEG, dateOfBirth: new Date("1992-05-19"), gender: "FEMALE", isAvailable: true, isRare: true, lastDonatedOn: daysAgo(100) } },
    { googleId: "seed-donor-0000000006", email: "aditya.verma@bloodlink.test", name: "Aditya Verma", phone: "9591834276", city: "Bengaluru", state: "Karnataka", pincode: "560100",
      profile: { bloodGroup: BloodGroup.A_NEG, dateOfBirth: new Date("1997-09-30"), gender: "MALE", isAvailable: false, isRare: false, lastDonatedOn: daysAgo(300) } },
    { googleId: "seed-donor-0000000007", email: "divya.prasad@bloodlink.test", name: "Divya Prasad", phone: "9686421907", city: "Bengaluru", state: "Karnataka", pincode: "560102",
      profile: { bloodGroup: BloodGroup.B_NEG, dateOfBirth: new Date("1993-12-14"), gender: "FEMALE", isAvailable: true, isRare: true, lastDonatedOn: daysAgo(60) } }, // ineligible
    // ---- Mysuru (4) ----
    { googleId: "seed-donor-0000000008", email: "manoj.gowda@bloodlink.test", name: "Manoj Gowda", phone: "9480765312", city: "Mysuru", state: "Karnataka", pincode: "570008",
      profile: { bloodGroup: BloodGroup.O_POS, dateOfBirth: new Date("1985-04-06"), gender: "MALE", isAvailable: true, isRare: false, lastDonatedOn: daysAgo(95) } },
    { googleId: "seed-donor-0000000009", email: "nisha.joseph@bloodlink.test", name: "Nisha Joseph", phone: "9448823106", city: "Mysuru", state: "Karnataka", pincode: "570009",
      profile: { bloodGroup: BloodGroup.AB_POS, dateOfBirth: new Date("1995-08-21"), gender: "FEMALE", isAvailable: true, isRare: false, lastDonatedOn: daysAgo(20) } }, // ineligible
    { googleId: "seed-donor-0000000010", email: "farhan.ali@bloodlink.test", name: "Farhan Ali", phone: "9611435802", city: "Mysuru", state: "Karnataka", pincode: "570002",
      profile: { bloodGroup: BloodGroup.B_NEG, dateOfBirth: new Date("1991-02-17"), gender: "MALE", isAvailable: true, isRare: true, lastDonatedOn: daysAgo(150) } },
    { googleId: "seed-donor-0000000011", email: "lakshmi.iyer@bloodlink.test", name: "Lakshmi Iyer", phone: "9845721098", city: "Mysuru", state: "Karnataka", pincode: "570004",
      profile: { bloodGroup: BloodGroup.A_POS, dateOfBirth: new Date("1989-10-03"), gender: "FEMALE", isAvailable: true, isRare: false, lastDonatedOn: null } },
    // ---- Hyderabad (4) ----
    { googleId: "seed-donor-0000000012", email: "arjun.reddy@bloodlink.test", name: "Arjun Reddy", phone: "9701324785", city: "Hyderabad", state: "Telangana", pincode: "500034",
      profile: { bloodGroup: BloodGroup.O_POS, dateOfBirth: new Date("1987-06-11"), gender: "MALE", isAvailable: true, isRare: false, lastDonatedOn: daysAgo(88) } }, // ineligible — just under 90 days
    { googleId: "seed-donor-0000000013", email: "kavya.hegde@bloodlink.test", name: "Kavya Hegde", phone: "9652418730", city: "Hyderabad", state: "Telangana", pincode: "500081",
      profile: { bloodGroup: BloodGroup.AB_POS, dateOfBirth: new Date("1996-01-29"), gender: "FEMALE", isAvailable: true, isRare: false, lastDonatedOn: daysAgo(180) } },
    { googleId: "seed-donor-0000000014", email: "tarun.bhatt@bloodlink.test", name: "Tarun Bhatt", phone: "9490918276", city: "Hyderabad", state: "Telangana", pincode: "500016",
      profile: { bloodGroup: BloodGroup.O_NEG, dateOfBirth: new Date("1990-03-23"), gender: "MALE", isAvailable: true, isRare: true, lastDonatedOn: daysAgo(400) } },
    { googleId: "seed-donor-0000000015", email: "meera.chandra@bloodlink.test", name: "Meera Chandra", phone: "9533214608", city: "Hyderabad", state: "Telangana", pincode: "500003",
      profile: { bloodGroup: BloodGroup.A_NEG, dateOfBirth: new Date("1998-07-15"), gender: "FEMALE", isAvailable: false, isRare: true, lastDonatedOn: daysAgo(55) } },
  ];

  const donors: Record<string, { id: string }> = {};
  for (const d of donorSeeds) {
    donors[d.email] = await prisma.user.create({
      data: {
        passwordHash,
        googleId: d.googleId,
        email: d.email,
        name: d.name,
        phone: d.phone,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        role: Role.DONOR,
        donorProfile: { create: d.profile },
      },
    });
  }

  /* -------------------------------------------------------------- stock */
  type StockRow = [BloodGroup, Component, number];
  const stockByOrg: Array<{ orgId: string; rows: StockRow[] }> = [
    {
      orgId: redCross.id,
      rows: [
        [BloodGroup.A_POS, Component.WHOLE_BLOOD, 18],
        [BloodGroup.A_NEG, Component.WHOLE_BLOOD, 4],
        [BloodGroup.B_POS, Component.WHOLE_BLOOD, 22],
        [BloodGroup.B_NEG, Component.WHOLE_BLOOD, 3],
        [BloodGroup.AB_POS, Component.WHOLE_BLOOD, 6],
        [BloodGroup.AB_NEG, Component.WHOLE_BLOOD, 1],
        [BloodGroup.O_POS, Component.WHOLE_BLOOD, 25],
        [BloodGroup.O_NEG, Component.WHOLE_BLOOD, 2],
        [BloodGroup.A_POS, Component.PLATELETS, 4],
        [BloodGroup.O_POS, Component.PLATELETS, 5],
        [BloodGroup.AB_NEG, Component.PLATELETS, 0], // zero units => RED tile
        [BloodGroup.O_POS, Component.PLASMA, 8],
      ],
    },
    {
      orgId: lionsBB.id,
      rows: [
        [BloodGroup.A_POS, Component.WHOLE_BLOOD, 6],
        [BloodGroup.A_NEG, Component.WHOLE_BLOOD, 0], // zero units => RED tile
        [BloodGroup.B_POS, Component.WHOLE_BLOOD, 9],
        [BloodGroup.B_NEG, Component.WHOLE_BLOOD, 1],
        [BloodGroup.AB_POS, Component.WHOLE_BLOOD, 2],
        [BloodGroup.AB_NEG, Component.WHOLE_BLOOD, 0], // zero units => RED tile
        [BloodGroup.O_POS, Component.WHOLE_BLOOD, 11],
        [BloodGroup.O_NEG, Component.WHOLE_BLOOD, 1],
        [BloodGroup.B_POS, Component.PLATELETS, 2],
        [BloodGroup.O_NEG, Component.PLASMA, 3],
      ],
    },
    {
      orgId: raktaLife.id,
      rows: [
        [BloodGroup.O_POS, Component.WHOLE_BLOOD, 5],
        [BloodGroup.O_NEG, Component.WHOLE_BLOOD, 1],
        [BloodGroup.A_POS, Component.WHOLE_BLOOD, 3],
        [BloodGroup.B_POS, Component.WHOLE_BLOOD, 4],
        [BloodGroup.O_POS, Component.PLATELETS, 2],
      ],
    },
    {
      orgId: jeevanDhara.id,
      rows: [
        [BloodGroup.O_POS, Component.WHOLE_BLOOD, 3],
        [BloodGroup.A_POS, Component.WHOLE_BLOOD, 2],
        [BloodGroup.B_NEG, Component.WHOLE_BLOOD, 1],
        [BloodGroup.AB_POS, Component.WHOLE_BLOOD, 1],
        [BloodGroup.A_POS, Component.PLASMA, 4],
      ],
    },
  ];
  for (const { orgId, rows } of stockByOrg) {
    await prisma.stock.createMany({
      data: rows.map(([bloodGroup, component, units]) => ({ orgId, bloodGroup, component, units })),
    });
  }

  /* ----------------------------------------------------------- requests */
  const r1 = await prisma.bloodRequest.create({
    data: {
      hospitalId: apollo.id,
      patientName: "Suresh Kumar (Post-operative)",
      bloodGroup: BloodGroup.A_POS,
      component: Component.WHOLE_BLOOD,
      units: 3,
      urgency: Urgency.CRITICAL,
      neededBy: hoursFromNow(6),
      city: "Bengaluru",
      pincode: "560076",
      note: "Post cardiac surgery transfusion — ICCU, 2nd floor. Bring any prior transfusion records.",
      status: RequestStatus.OPEN,
      createdAt: hoursAgo(2),
    },
  });

  const r2 = await prisma.bloodRequest.create({
    data: {
      hospitalId: apollo.id,
      patientName: "Baby of Rekha",
      bloodGroup: BloodGroup.O_NEG,
      component: Component.WHOLE_BLOOD,
      units: 2,
      urgency: Urgency.CRITICAL,
      neededBy: hoursFromNow(10),
      city: "Bengaluru",
      pincode: "560076",
      note: "Neonatal exchange transfusion — NICU. Donor screening mandatory before transfusion.",
      status: RequestStatus.OPEN,
      createdAt: hoursAgo(6),
    },
  });

  const r3 = await prisma.bloodRequest.create({
    data: {
      hospitalId: jayadeva.id,
      patientName: "Rukmini Devi",
      bloodGroup: BloodGroup.B_POS,
      component: Component.WHOLE_BLOOD,
      units: 4,
      urgency: Urgency.URGENT,
      neededBy: hoursFromNow(24),
      city: "Mysuru",
      pincode: "570001",
      note: "Open-heart surgery standby — units confirmed on first-come basis at the hospital blood bank.",
      status: RequestStatus.OPEN,
      createdAt: hoursAgo(12),
    },
  });

  const r4 = await prisma.bloodRequest.create({
    data: {
      hospitalId: jayadeva.id,
      patientName: "Harish Chandra",
      bloodGroup: BloodGroup.AB_NEG,
      component: Component.PLATELETS,
      units: 1,
      urgency: Urgency.CRITICAL,
      neededBy: hoursFromNow(8),
      city: "Mysuru",
      pincode: "570001",
      note: "Dengue case — platelet count crashed. Single-donor apheresis preferred over pooled units.",
      status: RequestStatus.OPEN,
      createdAt: daysAgo(1),
    },
  });

  const r5 = await prisma.bloodRequest.create({
    data: {
      hospitalId: osmania.id,
      patientName: "Mohd. Irfan",
      bloodGroup: BloodGroup.O_POS,
      component: Component.WHOLE_BLOOD,
      units: 6,
      urgency: Urgency.URGENT,
      neededBy: hoursFromNow(24),
      city: "Hyderabad",
      pincode: "500012",
      note: "Road traffic accident — massive transfusion protocol activated in emergency OT.",
      status: RequestStatus.OPEN,
      createdAt: hoursAgo(4),
    },
  });

  const r6 = await prisma.bloodRequest.create({
    data: {
      hospitalId: osmania.id,
      patientName: "Lata Suresh",
      bloodGroup: BloodGroup.A_NEG,
      component: Component.PLASMA,
      units: 2,
      urgency: Urgency.NORMAL,
      neededBy: hoursFromNow(72),
      city: "Hyderabad",
      pincode: "500012",
      note: "Planned liver transplant workup — fresh frozen plasma required.",
      status: RequestStatus.OPEN,
      createdAt: daysAgo(2),
    },
  });

  const r7 = await prisma.bloodRequest.create({
    data: {
      hospitalId: apollo.id,
      patientName: "Ganesh Prabhu",
      bloodGroup: BloodGroup.B_NEG,
      component: Component.WHOLE_BLOOD,
      units: 1,
      urgency: Urgency.NORMAL,
      neededBy: hoursFromNow(120),
      city: "Bengaluru",
      pincode: "560076",
      note: "Elective surgery scheduled — fulfilled via a kind walk-in donor.",
      status: RequestStatus.FULFILLED,
      createdAt: daysAgo(4),
    },
  });

  const r8 = await prisma.bloodRequest.create({
    data: {
      hospitalId: jayadeva.id,
      patientName: "Chandini Rao",
      bloodGroup: BloodGroup.AB_POS,
      component: Component.PLATELETS,
      units: 2,
      urgency: Urgency.URGENT,
      neededBy: hoursFromNow(48),
      city: "Mysuru",
      pincode: "570001",
      note: "Oncology support — closed after the patient was transferred to Bengaluru.",
      status: RequestStatus.CLOSED,
      createdAt: daysAgo(3),
    },
  });

  // r2, r5, r6, r8 stay unreferenced (kept for feed variety in the demo data).
  void [r2, r5, r6, r8];

  /* ---------------------------------------------------------- responses */
  await prisma.requestResponse.createMany({
    data: [
      {
        requestId: r1.id,
        responderId: donors["ananya.sharma@bloodlink.test"].id,
        status: ResponseStatus.PLEDGED,
        message: "Will reach the hospital blood bank by 5 PM today.",
        createdAt: minutesAgo(45),
      },
      {
        requestId: r1.id,
        responderId: donors["aditya.verma@bloodlink.test"].id,
        status: ResponseStatus.PLEDGED,
        message: "Available tomorrow morning if more units are needed.",
        createdAt: minutesAgo(30),
      },
      {
        requestId: r4.id,
        responderId: donors["priya.nair@bloodlink.test"].id,
        status: ResponseStatus.PLEDGED,
        message: "Can come in by evening; carrying my previous donation reports.",
        createdAt: hoursAgo(20),
      },
      {
        requestId: r3.id,
        responderId: donors["farhan.ali@bloodlink.test"].id,
        status: ResponseStatus.DECLINED,
        message: "Travelling that day, sorry.",
        createdAt: hoursAgo(10),
      },
      {
        requestId: r7.id,
        responderId: donors["sneha.patil@bloodlink.test"].id,
        status: ResponseStatus.DONATED,
        message: "Donated whole blood at the Apollo blood bank.",
        createdAt: daysAgo(1),
      },
      {
        requestId: r7.id,
        responderId: donors["divya.prasad@bloodlink.test"].id,
        status: ResponseStatus.DECLINED,
        message: "Out of town that week.",
        createdAt: daysAgo(3),
      },
    ],
  });

  /* -------------------------------------------------------------- camps */
  await prisma.camp.createMany({
    data: [
      {
        orgId: raktaLife.id,
        title: "Koramangala Winter Blood Donation Drive",
        venue: "Community Hall, 5th Block, Koramangala",
        city: "Bengaluru",
        pincode: "560034",
        date: daysFromNow(7),
        startTime: "09:00",
        endTime: "14:00",
        description:
          "Voluntary whole-blood donation camp in association with Red Cross Bengaluru. Walk-ins welcome with a photo ID. Free donor refreshments and certificates.",
        bloodGroupsNeeded: [BloodGroup.O_POS, BloodGroup.A_POS, BloodGroup.B_POS],
      },
      {
        orgId: raktaLife.id,
        title: "ITPL Tech Park Donation Camp",
        venue: "Prestige Tech Park Auditorium, Kadugodi, Whitefield",
        city: "Bengaluru",
        pincode: "560067",
        date: daysFromNow(14),
        startTime: "10:00",
        endTime: "16:00",
        description:
          "Corporate blood donation camp open to employees of all ITPL companies. Pre-registration recommended at the venue desk.",
        bloodGroupsNeeded: [BloodGroup.O_POS, BloodGroup.O_NEG, BloodGroup.B_POS],
      },
      {
        orgId: jeevanDhara.id,
        title: "Nampally Community Donation Camp",
        venue: "Urdu Hall Grounds, Nampally",
        city: "Hyderabad",
        pincode: "500001",
        date: daysFromNow(10),
        startTime: "09:30",
        endTime: "13:30",
        description:
          "Community camp organised with local hospitals. Donors aged 18–65 weighing above 50 kg are eligible. Free haemoglobin screening on site.",
        bloodGroupsNeeded: [BloodGroup.AB_POS, BloodGroup.B_POS, BloodGroup.O_POS],
      },
    ],
  });

  /* ------------------------------------------------------------ summary */
  const [users, donorProfiles, orgProfiles, stock, camps, requests, responses] =
    await Promise.all([
      prisma.user.count(),
      prisma.donorProfile.count(),
      prisma.orgProfile.count(),
      prisma.stock.count(),
      prisma.camp.count(),
      prisma.bloodRequest.count(),
      prisma.requestResponse.count(),
    ]);

  console.log("✔ seed complete:");
  console.table({ users, donorProfiles, orgProfiles, stock, camps, requests, responses });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
