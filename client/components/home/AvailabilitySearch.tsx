"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMPONENTS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/forms";
import { SearchIcon } from "@/components/ui/icons";

/** "Check blood availability" search panel → /dashboard with query params. */
export function AvailabilitySearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [component, setComponent] = useState("WHOLE_BLOOD");

  return (
    <Card>
      <CardBody className="space-y-3">
        <p className="text-sm font-semibold text-navy">Check blood availability</p>
        <Field label="City" htmlFor="home-city">
          <Input
            id="home-city"
            placeholder="All cities"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>
        <Field label="Component" htmlFor="home-component">
          <Select id="home-component" value={component} onChange={(e) => setComponent(e.target.value)}>
            {COMPONENTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          className="w-full"
          onClick={() =>
            router.push(
              `/dashboard?city=${encodeURIComponent(city.trim())}&component=${encodeURIComponent(component)}`,
            )
          }
        >
          <SearchIcon className="h-4 w-4" />
          Check availability
        </Button>
        <p className="text-2xs leading-relaxed text-muted">
          Counts only donors who are available and have completed the 90-day donation gap, plus
          live stock from NGOs and blood banks.
        </p>
      </CardBody>
    </Card>
  );
}
