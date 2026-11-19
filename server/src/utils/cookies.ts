import { isProd } from "../config.js";

export const COOKIE_NAME = "bloodlink_token";
export const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: COOKIE_MAX_AGE_MS,
};

/** Options used by res.cookie to clear the session cookie. */
export const clearedCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  expires: new Date(0),
};
