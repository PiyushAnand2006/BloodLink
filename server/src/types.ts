import type { User } from "@prisma/client";

/**
 * Augment Express' Request with the authenticated user attached by
 * `requireAuth`. Always populated from the database — never from the
 * request body or a stale token payload.
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
