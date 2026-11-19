"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { BLOOD_GROUPS, COMPONENTS, URGENCIES, type ApiRequest } from "@/lib/constants";
import { dateTimeInputValue } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/forms";

const requestSchema = z.object({
  patientName: z.string().trim().min(2, "Patient name is required"),
  bloodGroup: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]),
  component: z.enum(["WHOLE_BLOOD", "PLATELETS", "PLASMA"]),
  units: z.coerce.number().int().min(1, "At least 1 unit").max(20, "Max 20 units"),
  urgency: z.enum(["CRITICAL", "URGENT", "NORMAL"]),
  neededBy: z.string().min(1, "Deadline is required"),
  city: z.string().trim().min(2, "City is required"),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode"),
  note: z.string().max(300, "Max 300 characters").optional(),
});
type RequestValues = z.infer<typeof requestSchema>;

export function RequestForm({
  existing,
  onSaved,
  onCancel,
}: {
  existing?: ApiRequest;
  onSaved: (request: ApiRequest) => void;
  onCancel?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    mode: "onTouched",
    values: existing
      ? {
          patientName: existing.patientName,
          bloodGroup: existing.bloodGroup,
          component: existing.component,
          units: existing.units,
          urgency: existing.urgency,
          neededBy: dateTimeInputValue(new Date(existing.neededBy)),
          city: existing.city,
          pincode: existing.pincode,
          note: existing.note ?? "",
        }
      : {
          patientName: "",
          bloodGroup: "O_NEG",
          component: "WHOLE_BLOOD",
          units: 2,
          urgency: "URGENT",
          neededBy: dateTimeInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
          city: "",
          pincode: "",
          note: "",
        },
  });

  const onSubmit = async (values: RequestValues) => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        patientName: values.patientName,
        bloodGroup: values.bloodGroup,
        component: values.component,
        units: values.units,
        urgency: values.urgency,
        neededBy: new Date(values.neededBy).toISOString(),
        city: values.city,
        pincode: values.pincode,
        note: values.note?.trim() || null,
      };
      const res = existing
        ? await api<{ request: ApiRequest }>(`/requests/${existing.id}`, { method: "PUT", body })
        : await api<{ request: ApiRequest }>("/requests", { method: "POST", body });
      onSaved(res.request);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Field label="Patient name / identifier" error={errors.patientName} required htmlFor="r-patient">
          <Input id="r-patient" placeholder="e.g. Suresh Kumar (ICCU, 2nd floor)" {...register("patientName")} />
        </Field>
      </div>

      <Field label="Blood group" error={errors.bloodGroup} required htmlFor="r-bg">
        <Select id="r-bg" {...register("bloodGroup")}>
          {BLOOD_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Component" error={errors.component} required htmlFor="r-component">
        <Select id="r-component" {...register("component")}>
          {COMPONENTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Units needed" error={errors.units} required htmlFor="r-units">
        <Input id="r-units" type="number" min={1} max={20} {...register("units")} />
      </Field>

      <Field label="Urgency" error={errors.urgency} required htmlFor="r-urgency">
        <Select id="r-urgency" {...register("urgency")}>
          {URGENCIES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Needed by" error={errors.neededBy} required htmlFor="r-needed">
        <Input id="r-needed" type="datetime-local" {...register("neededBy")} />
      </Field>

      <Field label="City" error={errors.city} required htmlFor="r-city">
        <Input id="r-city" placeholder="Bengaluru" {...register("city")} />
      </Field>

      <Field label="Pincode" error={errors.pincode} required htmlFor="r-pincode">
        <Input id="r-pincode" inputMode="numeric" placeholder="560076" {...register("pincode")} />
      </Field>

      <div className="sm:col-span-2">
        <Field
          label="Note (optional)"
          error={errors.note}
          hint="Ward, transfusion context, donor screening requirements…"
          htmlFor="r-note"
        >
          <Textarea id="r-note" maxLength={300} {...register("note")} />
        </Field>
      </div>

      {error && (
        <p className="sm:col-span-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={saving}>
          {existing ? "Save changes" : "Post request"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
