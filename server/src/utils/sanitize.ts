import type { DonorProfile, OrgProfile, User } from "@prisma/client";

/**
 * Response shaping helpers. Never leak googleId or other users' phone
 * numbers through these — phone visibility rules are applied in the
 * controllers that compose responses.
 */

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: User["role"];
  phone: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  createdAt: Date;
  donorProfile?: DonorProfile | null;
  orgProfile?: OrgProfile | null;
}

export function publicUser(
  user: User & { donorProfile?: DonorProfile | null; orgProfile?: OrgProfile | null },
): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    phone: user.phone,
    city: user.city,
    state: user.state,
    pincode: user.pincode,
    createdAt: user.createdAt,
    // Relations are included only when the query actually loaded them.
    ...(user.donorProfile !== undefined ? { donorProfile: user.donorProfile } : {}),
    ...(user.orgProfile !== undefined ? { orgProfile: user.orgProfile } : {}),
  };
}

/** What any authenticated viewer may see about a hospital on a request. */
export interface PublicHospital {
  id: string;
  orgName: string | null;
  city: string | null;
  pincode: string | null;
  contactPerson: string | null;
}

export function publicHospital(
  user: User & { orgProfile?: OrgProfile | null },
): PublicHospital {
  return {
    id: user.id,
    orgName: user.orgProfile?.orgName ?? user.name,
    city: user.city,
    pincode: user.pincode,
    contactPerson: user.orgProfile?.contactPerson ?? null,
  };
}
