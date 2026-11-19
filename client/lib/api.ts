"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetail[];

  constructor(status: number, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Thin fetch wrapper: JSON in/out, cookie credentials, typed errors. */
export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let details: ApiErrorDetail[] | undefined;
    try {
      const data = await res.json();
      message = data?.error?.message ?? message;
      details = data?.error?.details;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new ApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Default SWR fetcher. */
export const fetcher = <T>(path: string): Promise<T> => api<T>(path);

/** Builds a query string from a params object (skips empty values). */
export function qs(params: Record<string, string | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
