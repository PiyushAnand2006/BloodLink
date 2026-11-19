import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { config, GOOGLE_CLIENT_ID_CONFIGURED, isDev } from "../config.js";
import { cookieOptions, COOKIE_NAME, clearedCookieOptions } from "../utils/cookies.js";
import { signToken } from "../utils/jwt.js";
import { publicUser } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errors.js";
import {
  googleLoginSchema,
  loginSchema,
  onboardingSchema,
  signupEmailSchema,
  devLoginSchema,
} from "../validators/index.js";

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);
const BCRYPT_ROUNDS = 10;

interface GoogleIdentity {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

/** Verifies a Google ID token and returns its identity (401 on any failure). */
async function verifyGoogleToken(credential: string): Promise<GoogleIdentity> {
  if (!GOOGLE_CLIENT_ID_CONFIGURED) {
    throw new ApiError(
      503,
      "Google login is not configured — set GOOGLE_CLIENT_ID on the server",
    );
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new ApiError(401, "Google ID token did not contain an email");
    }
    return { sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Google ID token is invalid or expired");
  }
}

/**
 * POST /auth/google — SIGN IN with an existing account.
 * Verifies the ID token, then looks the account up. Accounts are created
 * only via POST /auth/register — an unknown Google account gets 404 with a
 * "create an account" message.
 */
export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { credential } = googleLoginSchema.parse(req.body);
  const payload = await verifyGoogleToken(credential);

  const user = await prisma.user.findUnique({ where: { googleId: payload.sub } });
  if (!user) {
    throw new ApiError(
      404,
      "No account exists for this Google account. Please create an account first.",
    );
  }

  // Keep the profile in sync with Google (name/avatar/email may change).
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: payload.email,
      name: payload.name ?? undefined,
      avatarUrl: payload.picture ?? undefined,
    },
  });

  const token = signToken(updated.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ user: publicUser(updated) });
}

/**
 * POST /auth/register — CREATE ACCOUNT via Google.
 * The user picks a role and fills their profile on the sign-up page; the
 * Google ID token (from the "Continue with Google" button on the same page)
 * proves identity. Creates the user WITH its role and profile in one step.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { credential } = googleLoginSchema.parse(req.body);
  const data = onboardingSchema.parse(req.body); // role + profile fields (strips credential)
  const payload = await verifyGoogleToken(credential);

  const existingById = await prisma.user.findUnique({ where: { googleId: payload.sub } });
  if (existingById) {
    throw new ApiError(
      409,
      "An account already exists for this Google account — please sign in instead.",
    );
  }
  const existingByEmail = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingByEmail) {
    throw new ApiError(
      409,
      "An account with this email already exists — please sign in instead.",
    );
  }

  // Organisations register inside a supported district (Karnataka for now).
  if (data.role !== "DONOR") {
    const district = await prisma.district.findUnique({ where: { id: data.districtId } });
    if (!district) {
      throw new ApiError(400, "Unknown district — pick one from the list");
    }
  }

  const user = await prisma.user.create({
    data: {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email.split("@")[0],
      avatarUrl: payload.picture ?? null,
      role: data.role,
      phone: data.phone,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      donorProfile:
        data.role === "DONOR"
          ? {
              create: {
                bloodGroup: data.bloodGroup,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                lastDonatedOn: data.lastDonatedOn ?? null,
              },
            }
          : undefined,
      orgProfile:
        data.role !== "DONOR"
          ? {
              create: {
                orgName: data.orgName,
                regNo: data.regNo,
                address: data.address,
                contactPerson: data.contactPerson,
                districtId: data.districtId,
              },
            }
          : undefined,
    },
  });

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(201).json({ user: publicUser(user) });
}

/**
 * POST /auth/register-email — CREATE ACCOUNT with email + password.
 * Same profile validation as Google registration; the password is stored
 * only as a bcrypt hash. Identity = email + password at sign-in.
 */
export async function registerEmail(req: Request, res: Response): Promise<void> {
  const data = onboardingSchema.parse(req.body); // role + profile fields
  const { name, email, password } = signupEmailSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists — please sign in instead.");
  }

  // Organisations register inside a supported district (Karnataka for now).
  if (data.role !== "DONOR") {
    const district = await prisma.district.findUnique({ where: { id: data.districtId } });
    if (!district) {
      throw new ApiError(400, "Unknown district — pick one from the list");
    }
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: data.role,
      phone: data.phone,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      donorProfile:
        data.role === "DONOR"
          ? {
              create: {
                bloodGroup: data.bloodGroup,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                lastDonatedOn: data.lastDonatedOn ?? null,
              },
            }
          : undefined,
      orgProfile:
        data.role !== "DONOR"
          ? {
              create: {
                orgName: data.orgName,
                regNo: data.regNo,
                address: data.address,
                contactPerson: data.contactPerson,
                districtId: data.districtId,
              },
            }
          : undefined,
    },
  });

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(201).json({ user: publicUser(user) });
}

/**
 * POST /auth/login — SIGN IN with email + password.
 * Unknown email → 404 with a "create an account" message; wrong password →
 * 401; Google-only accounts are told to continue with Google.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(
      404,
      "No account exists with this email. Please create an account first.",
    );
  }
  if (!user.passwordHash) {
    throw new ApiError(
      409,
      "This account was created with Google — please continue with Google.",
    );
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Incorrect password.");
  }

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ user: publicUser(user) });
}

/** GET /auth/me — current user (401 when not logged in). */
export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { donorProfile: true, orgProfile: true },
  });
  res.json({ user: publicUser(user!) });
}

/** POST /auth/logout — clear the session cookie. */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.cookie(COOKIE_NAME, "", clearedCookieOptions);
  res.json({ success: true });
}

/**
 * POST /auth/dev — DEVELOPMENT ONLY.
 * One-click login for the seeded demo accounts shown in the login page's
 * dev panel. Logs in an EXISTING account by email only (no account is
 * created, and it never runs in production).
 */
export async function devLogin(req: Request, res: Response): Promise<void> {
  if (!isDev) {
    throw new ApiError(404, "Not found");
  }
  const { email } = devLoginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(404, "No demo account with this email — run npm run db:seed");
  }

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ user: publicUser(user) });
}
