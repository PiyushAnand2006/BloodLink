import { rateLimit } from "express-rate-limit";
import { config } from "../config.js";

/** Global API limiter. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many requests — please slow down" } },
});

/** Tighter limiter for auth endpoints (token minting). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.RATE_LIMIT_AUTH_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many login attempts — try again later" } },
});
