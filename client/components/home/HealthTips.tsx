"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CheckCircleIcon, InfoIcon } from "@/components/ui/icons";

const CAN_DONATE = [
  "You are between 18 and 65 years of age",
  "Your weight is 50 kg or more",
  "Your haemoglobin is 12.5 g/dL or higher",
  "At least 90 days have passed since your last whole-blood donation",
  "You are generally healthy and free of infections",
];

const GOOD_TO_KNOW = [
  "One whole-blood donation can help up to three patients — red cells, plasma and platelets are separated.",
  "The donation itself takes only 15–20 minutes; the needle time is under 10.",
  "Eat a full meal and drink plenty of water before donating.",
  "After donating, rest for 15 minutes and avoid heavy lifting for the rest of the day.",
];

/** Educational health-info section (static content, screening always happens at the blood bank). */
export function HealthTips() {
  return (
    <section aria-labelledby="home-health">
      <div className="mb-4">
        <h2 id="home-health" className="text-xl font-semibold text-navy">
          Learn about blood donation
        </h2>
        <span className="mt-1.5 block h-1 w-12 rounded bg-primary" aria-hidden />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-navy">Who can donate?</h3>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {CAN_DONATE.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded bg-subtle px-3 py-2 text-2xs text-muted">
              Final eligibility is always confirmed by the blood bank or hospital after screening.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-navy">Good to know before you donate</h3>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {GOOD_TO_KNOW.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink">
                  <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded bg-subtle px-3 py-2 text-2xs text-muted">
              Donate whole blood every 90 days at most — the dashboard shows your next eligible date
              automatically.
            </p>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
