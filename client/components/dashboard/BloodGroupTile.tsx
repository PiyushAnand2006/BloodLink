"use client";

import type { ReactNode } from "react";
import type { ApiSummaryItem } from "@/lib/constants";
import { bloodGroupLabel, LEVEL_META } from "@/lib/constants";
import {
  AlertTriangleIcon,
  BoxIcon,
  CheckCircleIcon,
  HospitalIcon,
  PersonIcon,
  XCircleIcon,
} from "@/components/ui/icons";

/**
 * Blood-group tile — lab-report style.
 *
 * The group letterform is the anchor. Level lives in a tinted chip (icon +
 * text, never colour alone) and a slim supply meter along the bottom edge
 * that fills toward the "Plenty" threshold: supply = donors + units, full
 * at 8, RED when empty. Figures replace prose rows — Donors / Units /
 * Requests side by side like lab values.
 */

const METER_MAX = 8; // supply at/above this reads as comfortably "Plenty"

function Figure({
  icon,
  label,
  value,
  urgent = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <div className="px-2.5 first:pl-0 last:pr-0">
      <p
        className={`text-lg font-bold leading-none tabular-nums ${
          urgent ? "text-danger" : "text-navy"
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-1.5 flex items-center gap-1 text-2xs ${
          urgent ? "font-semibold text-danger" : "text-muted"
        }`}
      >
        {icon}
        {label}
      </p>
    </div>
  );
}

export function BloodGroupTile({ item }: { item: ApiSummaryItem }) {
  const meta = LEVEL_META[item.level];
  const ChipIcon =
    item.level === "GREEN"
      ? CheckCircleIcon
      : item.level === "AMBER"
        ? AlertTriangleIcon
        : XCircleIcon;

  const supply = item.donorsAvailable + item.unitsAvailable;
  const fillPct = Math.min(100, Math.round((supply / METER_MAX) * 100));
  const needsDonors = item.openRequests > 0;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      {/* Group letterform + level chip */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <span className="text-[30px] font-bold leading-none tracking-tight text-navy">
          {bloodGroupLabel(item.bloodGroup)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${meta.chip}`}
        >
          <ChipIcon className="h-3 w-3" aria-hidden />
          {meta.label}
        </span>
      </div>

      {/* Figures — Donors / Units / Requests */}
      <div className="mt-3.5 grid grid-cols-3 divide-x divide-line/70 px-4 pb-3.5">
        <Figure
          icon={<PersonIcon className="h-3 w-3" aria-hidden />}
          label="Donors"
          value={item.donorsAvailable}
        />
        <Figure
          icon={<BoxIcon className="h-3 w-3" aria-hidden />}
          label="Units"
          value={item.unitsAvailable}
        />
        <Figure
          icon={<HospitalIcon className="h-3 w-3" aria-hidden />}
          label="Requests"
          value={item.openRequests}
          urgent={needsDonors}
        />
      </div>

      {/* Supply meter — fills toward the Plenty threshold */}
      <div className="px-4 pb-3.5">
        <div
          className="h-1 rounded-full bg-line"
          role="img"
          aria-label={`Supply level: ${supply} available (${meta.label})`}
        >
          <div
            className={`h-1 rounded-full transition-[width] duration-500 ${meta.bar}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
