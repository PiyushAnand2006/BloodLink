"use client";

import type { ApiSummaryItem } from "@/lib/constants";
import { bloodGroupLabel, LEVEL_META } from "@/lib/constants";
import { AlertTriangleIcon, BoxIcon, CheckCircleIcon, DropIcon, HospitalIcon, PersonIcon, XCircleIcon } from "@/components/ui/icons";

function StatRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span
        className={`flex items-center gap-1.5 text-xs ${highlight && value > 0 ? "font-semibold text-danger" : "text-muted"}`}
      >
        {icon}
        {label}
      </span>
      <span
        className={`font-semibold tabular-nums ${highlight && value > 0 ? "text-danger" : "text-navy"}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * One blood-group tile: large label + drop icon, three counts
 * (Donors / Units / Open requests) and a status strip — always icon + text
 * alongside the colour (accessibility rule: never colour alone).
 */
export function BloodGroupTile({ item }: { item: ApiSummaryItem }) {
  const meta = LEVEL_META[item.level];
  const StripIcon =
    item.level === "GREEN" ? CheckCircleIcon : item.level === "AMBER" ? AlertTriangleIcon : XCircleIcon;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      <div className="flex items-start justify-between px-4 pt-4">
        <span className="text-3xl font-bold tracking-tight text-navy">
          {bloodGroupLabel(item.bloodGroup)}
        </span>
        <DropIcon
          className={`h-8 w-8 ${
            item.level === "RED" ? "text-danger" : item.level === "AMBER" ? "text-warning" : "text-success"
          }`}
        />
      </div>

      <div className="mt-2 divide-y divide-line/70 px-4 pb-3">
        <StatRow icon={<PersonIcon className="h-3.5 w-3.5" />} label="Donors" value={item.donorsAvailable} />
        <StatRow icon={<BoxIcon className="h-3.5 w-3.5" />} label="Units" value={item.unitsAvailable} />
        <StatRow
          icon={<HospitalIcon className="h-3.5 w-3.5" />}
          label="Open requests"
          value={item.openRequests}
          highlight
        />
      </div>

      <div
        className={`flex items-center gap-1.5 px-4 py-2 text-2xs font-bold uppercase tracking-wider text-white ${meta.strip}`}
        aria-label={`Status: ${meta.label}`}
      >
        <StripIcon className="h-3.5 w-3.5" />
        {meta.label}
      </div>
    </div>
  );
}
