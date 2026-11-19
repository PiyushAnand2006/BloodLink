"use client";

import { useEffect, useState } from "react";
import { COMPONENTS } from "@/lib/constants";
import { Input, Select } from "@/components/ui/forms";
import { SearchIcon } from "@/components/ui/icons";

/**
 * Dashboard filter bar — city (debounced) + component.
 */
export function SummaryFilters({
  city,
  component,
  onChange,
}: {
  city: string;
  component: string;
  onChange: (next: { city: string; component: string }) => void;
}) {
  const [cityDraft, setCityDraft] = useState(city);

  useEffect(() => setCityDraft(city), [city]);

  // Debounce city typing so SWR keys don't churn per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      if (cityDraft !== city) onChange({ city: cityDraft, component });
    }, 400);
    return () => clearTimeout(t);
  }, [cityDraft, city, component, onChange]);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="w-56">
        <label htmlFor="filter-city" className="mb-1 block text-xs font-semibold text-navy">
          City
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
          <Input
            id="filter-city"
            className="pl-8"
            placeholder="All cities"
            value={cityDraft}
            onChange={(e) => setCityDraft(e.target.value)}
          />
        </div>
      </div>
      <div className="w-48">
        <label htmlFor="filter-component" className="mb-1 block text-xs font-semibold text-navy">
          Component
        </label>
        <Select
          id="filter-component"
          value={component}
          onChange={(e) => onChange({ city: cityDraft, component: e.target.value })}
        >
          {COMPONENTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
