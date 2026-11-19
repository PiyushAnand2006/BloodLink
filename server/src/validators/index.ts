import { z } from "zod";

/* ---------------------------------------------------------------- */
/* Shared primitives                                                 */
/* ---------------------------------------------------------------- */

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Must be a 10-digit Indian mobile number (starts 6-9)");

export const pincodeSchema = z
  .string()
  .regex(/^[1-9]\d{5}$/, "Must be a 6-digit Indian pincode");

/** District ids (validated against the District table in controllers). */
export const districtIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]{1,40}$/, "Invalid district");

export const bloodGroupSchema = z.enum([
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
]);

export const componentSchema = z.enum(["WHOLE_BLOOD", "PRBC", "PLATELETS", "FFP"]);

export const urgencySchema = z.enum(["CRITICAL", "URGENT", "NORMAL"]);

export const requestStatusSchema = z.enum(["OPEN", "FULFILLED", "CLOSED"]);

export const responseStatusSchema = z.enum(["PLEDGED", "DONATED", "DECLINED"]);

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);

const nameish = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

/* ---------------------------------------------------------------- */
/* Auth                                                              */
/* ---------------------------------------------------------------- */

export const googleLoginSchema = z.object({
  credential: z.string().min(20, "Missing Google ID token"),
});

/** Dev-only quick login for seeded demo accounts (see authController.devLogin). */
export const devLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

/** Name + email + password section of the sign-up form (email/password path). */
export const signupEmailSchema = z.object({
  name: nameish(2, 80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: passwordSchema,
});

/* ---------------------------------------------------------------- */
/* Profile / onboarding                                              */
/* ---------------------------------------------------------------- */

const contactFields = {
  phone: phoneSchema,
  city: nameish(2, 80),
  state: nameish(2, 80),
  pincode: pincodeSchema,
};

export const onboardingSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("DONOR"),
    ...contactFields,
    bloodGroup: bloodGroupSchema,
    dateOfBirth: z.coerce.date().refine((d) => d.getTime() < Date.now(), {
      message: "Date of birth must be in the past",
    }),
    gender: genderSchema,
    lastDonatedOn: z.coerce.date().nullable().optional(),
  }),
  z.object({
    role: z.enum(["NGO", "BLOOD_BANK", "HOSPITAL"]),
    ...contactFields,
    orgName: nameish(2, 120),
    regNo: nameish(2, 60),
    address: nameish(4, 200),
    contactPerson: nameish(2, 80),
    // Registered district — required for organisations at signup; the
    // controller verifies the id exists in the District master table.
    districtId: districtIdSchema,
  }),
]);

export const profileUpdateSchema = z.object({
  name: nameish(2, 80),
  ...contactFields,
});

/* ---------------------------------------------------------------- */
/* Donor                                                             */
/* ---------------------------------------------------------------- */

export const donorUpdateSchema = z.object({
  bloodGroup: bloodGroupSchema,
  dateOfBirth: z.coerce.date().refine((d) => d.getTime() < Date.now(), {
    message: "Date of birth must be in the past",
  }),
  gender: genderSchema,
  isRare: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  lastDonatedOn: z.coerce.date().nullable().optional(),
});

export const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

/* ---------------------------------------------------------------- */
/* Stock                                                             */
/* ---------------------------------------------------------------- */

export const stockCreateSchema = z.object({
  bloodGroup: bloodGroupSchema,
  component: componentSchema,
  units: z.number().int().min(0).max(500),
});

export const stockUpdateSchema = z.object({
  units: z.number().int().min(0).max(500),
  bloodGroup: bloodGroupSchema.optional(),
  component: componentSchema.optional(),
});

/* ---------------------------------------------------------------- */
/* Camps                                                             */
/* ---------------------------------------------------------------- */

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const campCreateSchema = z
  .object({
    title: nameish(3, 120),
    venue: nameish(3, 160),
    city: nameish(2, 80),
    districtId: districtIdSchema.optional().nullable(),
    pincode: pincodeSchema,
    date: z.coerce.date(),
    startTime: z.string().regex(timeRegex, "Use 24h HH:mm"),
    endTime: z.string().regex(timeRegex, "Use 24h HH:mm"),
    description: z.string().trim().max(600).optional().nullable(),
    bloodGroupsNeeded: z.array(bloodGroupSchema).min(1).max(8),
  })
  .refine((c) => c.startTime < c.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const campUpdateSchema = campCreateSchema;

/* ---------------------------------------------------------------- */
/* Blood requests                                                    */
/* ---------------------------------------------------------------- */

export const requestCreateSchema = z.object({
  patientName: nameish(2, 80),
  bloodGroup: bloodGroupSchema,
  component: componentSchema,
  units: z.number().int().min(1).max(20),
  urgency: urgencySchema,
  neededBy: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "neededBy must be in the future",
  }),
  city: nameish(2, 80),
  pincode: pincodeSchema,
  note: z.string().trim().max(300).optional().nullable(),
});

export const requestUpdateSchema = requestCreateSchema.omit({ neededBy: true }).extend({
  neededBy: z.coerce.date().optional(),
});

export const requestStatusUpdateSchema = z.object({
  status: requestStatusSchema,
});

/* ---------------------------------------------------------------- */
/* Responses                                                         */
/* ---------------------------------------------------------------- */

export const responseCreateSchema = z.object({
  message: z.string().trim().max(200).optional().nullable(),
});

export const responseUpdateSchema = z.object({
  status: responseStatusSchema,
});

/* ---------------------------------------------------------------- */
/* Admin                                                             */
/* ---------------------------------------------------------------- */

export const verifyOrgSchema = z.object({
  isVerified: z.boolean(),
});

/**
 * Path params: ids are validated (cuid/alphanumeric shape) before they are
 * ever passed to database queries.
 */
const idShape = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]{1,40}$/, "Invalid id");

export const idParamsSchema = z.object({ id: idShape });

export const userIdParamsSchema = z.object({ userId: idShape });
