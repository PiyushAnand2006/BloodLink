import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { isDev } from "../config.js";

/**
 * Central error handling: controllers throw `ApiError`; anything unexpected
 * is logged and surfaced as a 500 without leaking internals.
 */
export class ApiError extends Error {
  status: number;
  details?: Array<{ path: string; message: string }>;

  constructor(
    status: number,
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: "Route not found" } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  // Controller-level Zod parses (path params, etc.) surface as clean 400s.
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Prisma known errors -> friendly status codes.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: { message: "A record with these values already exists" } });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: { message: "Record not found" } });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({ error: { message: "Related record is missing or cannot be deleted" } });
      return;
    }
  }

  // Body-parse / malformed JSON.
  if (typeof err === "object" && err !== null && "type" in err && (err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Malformed JSON body" } });
    return;
  }

  console.error("[unhandled error]", err);
  res.status(500).json({
    error: {
      message: "Internal server error",
      ...(isDev && err instanceof Error ? { devDetail: err.message } : {}),
    },
  });
}
