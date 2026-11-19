import type { NextFunction, Request, Response } from "express";
import type { Role, User } from "@prisma/client";
import { prisma } from "../prisma.js";
import { COOKIE_NAME } from "../utils/cookies.js";
import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "./errors.js";

/**
 * Verifies the httpOnly JWT cookie and loads the user fresh from the
 * database. The user's role is ALWAYS taken from the DB — never from the
 * token payload or request body.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, "Not authenticated");
  }
  const payload = verifyToken(token);
  if (!payload) {
    throw new ApiError(401, "Session expired or invalid — please log in again");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) {
    throw new ApiError(401, "Account no longer exists");
  }
  req.user = user;
  next();
}

export const RESPONDER_ROLES: Role[] = ["DONOR", "NGO", "BLOOD_BANK"];

/**
 * Like requireAuth, but optional: attaches the user when a valid session
 * cookie exists, and never fails. Used on public endpoints where the
 * response is richer for logged-in users (request detail/feed).
 */
export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = await prisma.user.findUnique({ where: { id: payload.uid } });
      if (user) req.user = user;
    }
  }
  next();
}

/** Restricts a route to the given role(s). A user without a role yet gets a clear hint. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user: User | undefined = req.user;
    if (!user) {
      next(new ApiError(401, "Not authenticated"));
      return;
    }
    if (!user.role) {
      next(new ApiError(403, "Complete onboarding first"));
      return;
    }
    if (!roles.includes(user.role)) {
      next(new ApiError(403, "Your role does not have access to this resource"));
      return;
    }
    next();
  };
}

/** Zod-body-validated routes only: parses req.body and replaces it with the typed result. */
export function validateBody(schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { issues: Array<{ path: Array<PropertyKey>; message: string }> } } }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success || result.data === undefined) {
      const details = (result.error?.issues ?? []).map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      }));
      next(new ApiError(400, "Validation failed", details));
      return;
    }
    req.body = result.data;
    next();
  };
}
