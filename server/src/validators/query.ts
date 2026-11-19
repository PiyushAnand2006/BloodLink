import { z } from "zod";
import { ApiError } from "../middleware/errors.js";
import {
  bloodGroupSchema,
  componentSchema,
  requestStatusSchema,
  urgencySchema,
} from "./index.js";

/**
 * Query-string schemas. Everything arrives as strings, so enums are used
 * directly and optional booleans use an explicit "true" sentinel.
 */

const truthy = z
  .string()
  .refine((v) => v === "true", "Must be 'true'")
  .optional();

const cityish = z.string().trim().min(2).max(80).optional();

export const dashboardQuerySchema = z.object({
  city: cityish,
  component: componentSchema.optional(),
});

export const requestsQuerySchema = z.object({
  bloodGroup: bloodGroupSchema.optional(),
  component: componentSchema.optional(),
  city: cityish,
  pincode: z
    .string()
    .regex(/^[1-9]\d{5}$/, "Must be a 6-digit Indian pincode")
    .optional(),
  urgency: urgencySchema.optional(),
  status: requestStatusSchema.optional(),
  mine: truthy,
});

export const donorsQuerySchema = z.object({
  bloodGroup: bloodGroupSchema.optional(),
  city: cityish,
  pincode: z
    .string()
    .regex(/^[1-9]\d{5}$/, "Must be a 6-digit Indian pincode")
    .optional(),
  rareOnly: truthy,
});

export const campsQuerySchema = z.object({
  city: cityish,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
  mine: truthy,
});

/** Parses req.query against a schema; throws ApiError(400) on failure. */
export function parseQuery<S extends z.ZodTypeAny>(
  schema: S,
  query: unknown,
): z.infer<S> {
  const result = schema.safeParse(query ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    }));
    throw new ApiError(400, "Validation failed", details);
  }
  return result.data;
}
