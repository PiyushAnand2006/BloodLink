import type { SVGProps } from "react";

/** Minimal stroke icon set (lucide-style) — used with badges so meaning is
 * never carried by colour alone. All accept className for sizing. */

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const DropIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 2.7s6.5 7 6.5 11.3a6.5 6.5 0 1 1-13 0C5.5 9.7 12 2.7 12 2.7Z" />
  </svg>
);

export const PersonIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);

export const BoxIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
);

export const HospitalIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15" />
    <path d="M2 21h20" />
    <path d="M12 7v6M9 10h6" />
  </svg>
);

export const CheckCircleIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 5-5.5" />
  </svg>
);

export const AlertTriangleIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const XCircleIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15 9-6 6M9 9l6 6" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const PhoneIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);

export const MapPinIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.1-5.6-3.2-5.6 3.2 1.3-6.1L3 9.6l6.3-.7L12 3Z" />
  </svg>
);

export const LogoutIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
  </svg>
);

export const EditIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const RefreshIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const ShieldCheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 2 4 5.5v6c0 5 3.4 8.8 8 10.5 4.6-1.7 8-5.5 8-10.5v-6L12 2Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01" />
    <path d="M12 11v6" />
  </svg>
);
