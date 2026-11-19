"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import { roleHome, type ApiUser, type Role } from "@/lib/constants";
import { PageSpinner } from "./ui/Button";

/**
 * Client-side route guard:
 *   - not logged in            → /login?next=<current path>
 *   - allow given, wrong role  → redirect to the role's home page
 * Every account is created with a role (email+password or Google sign-up),
 * so a missing role only occurs on legacy/dev data.
 */
export function ProtectedShell({
  allow,
  children,
}: {
  allow?: Role[];
  children: ReactNode | ((user: ApiUser) => ReactNode);
}) {
  const { user, isLoading, unauthorized } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (unauthorized || user === null || user === undefined) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allow && (!user.role || !allow.includes(user.role))) {
      router.replace(roleHome(user.role));
    }
  }, [user, isLoading, unauthorized, allow, pathname, router]);

  if (isLoading || !user) {
    return <PageSpinner />;
  }
  if (allow && (!user.role || !allow.includes(user.role))) {
    return <PageSpinner />;
  }

  return <>{typeof children === "function" ? children(user) : children}</>;
}
