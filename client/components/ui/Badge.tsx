import type { ReactNode } from "react";
import type { RequestStatus, ResponseStatus, Urgency } from "@/lib/constants";
import { requestStatusLabel, responseStatusLabel, urgencyLabel } from "@/lib/constants";
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, InfoIcon, XCircleIcon } from "./icons";

type Tone = "danger" | "warning" | "info" | "success" | "neutral" | "primary";

const TONE_CLASSES: Record<Tone, string> = {
  danger: "bg-primary-50 text-danger border-primary-100",
  warning: "bg-[#FFF7E0] text-[#8a6d00] border-[#F5E6B8]",
  info: "bg-[#E8F1FC] text-info border-[#C7DBF5]",
  success: "bg-[#EAF5EB] text-success border-[#CBE5CD]",
  neutral: "bg-subtle text-muted border-line",
  primary: "bg-primary-50 text-primary border-primary-100",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className = "",
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

/** Urgency badge — Critical (red), Urgent (orange), Normal (blue). */
export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const tone: Tone = urgency === "CRITICAL" ? "danger" : urgency === "URGENT" ? "warning" : "info";
  const Icon = urgency === "CRITICAL" ? AlertTriangleIcon : urgency === "URGENT" ? ClockIcon : InfoIcon;
  return (
    <Badge tone={tone} icon={<Icon className="h-3 w-3" />}>
      {urgencyLabel(urgency)}
    </Badge>
  );
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const tone: Tone = status === "OPEN" ? "primary" : status === "FULFILLED" ? "success" : "neutral";
  const Icon = status === "OPEN" ? ClockIcon : status === "FULFILLED" ? CheckCircleIcon : XCircleIcon;
  return (
    <Badge tone={tone} icon={<Icon className="h-3 w-3" />}>
      {requestStatusLabel(status)}
    </Badge>
  );
}

export function ResponseStatusBadge({ status }: { status: ResponseStatus }) {
  const tone: Tone = status === "PLEDGED" ? "primary" : status === "DONATED" ? "success" : "neutral";
  const Icon = status === "PLEDGED" ? ClockIcon : status === "DONATED" ? CheckCircleIcon : XCircleIcon;
  return (
    <Badge tone={tone} icon={<Icon className="h-3 w-3" />}>
      {responseStatusLabel(status)}
    </Badge>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge tone="success" icon={<CheckCircleIcon className="h-3 w-3" />}>
      Verified
    </Badge>
  ) : (
    <Badge tone="warning" icon={<AlertTriangleIcon className="h-3 w-3" />}>
      Pending verification
    </Badge>
  );
}
