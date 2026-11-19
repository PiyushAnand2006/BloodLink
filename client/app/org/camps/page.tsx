"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { BLOOD_GROUPS, bloodGroupLabel, type ApiCamp } from "@/lib/constants";
import { dateInputValue, fmtDate } from "@/lib/format";
import { useCamps, useDistricts } from "@/hooks/useApiData";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Field, Input, Textarea } from "@/components/ui/forms";
import { CalendarIcon, MapPinIcon, PlusIcon } from "@/components/ui/icons";

interface CampFormValues {
  title: string;
  venue: string;
  city: string;
  districtId: string;
  pincode: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  bloodGroupsNeeded: string[];
}

const emptyCamp: CampFormValues = {
  title: "",
  venue: "",
  city: "",
  districtId: "",
  pincode: "",
  date: dateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  startTime: "09:00",
  endTime: "14:00",
  description: "",
  bloodGroupsNeeded: ["O_POS"],
};

function CampsInner() {
  const { data, mutate } = useCamps({ mine: true });
  const [editing, setEditing] = useState<ApiCamp | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (values: CampFormValues, id?: string) => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        title: values.title.trim(),
        venue: values.venue.trim(),
        city: values.city.trim(),
        districtId: values.districtId || null,
        pincode: values.pincode.trim(),
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        description: values.description.trim() || null,
        bloodGroupsNeeded: values.bloodGroupsNeeded,
      };
      if (id) await api(`/camps/${id}`, { method: "PUT", body });
      else await api("/camps", { method: "POST", body });
      await mutate();
      setEditing(null);
      setCreating(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the camp");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await api(`/camps/${id}`, { method: "DELETE" });
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete the camp");
    }
  };

  return (
    <div className="py-2">
      <PageHeader
        title="My camps"
        subtitle="Donation camps you organise appear on the public camps page and the dashboard strip."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" />
            New camp
          </Button>
        }
      />

      {error && (
        <p className="mb-4 rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {data && data.camps.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon />}
          title="No camps yet"
          hint="Create your first donation camp — donors nearby will see it on the camps page."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon className="h-4 w-4" />
              New camp
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data?.camps.map((camp) => {
            const past = new Date(camp.date).getTime() < new Date().setHours(0, 0, 0, 0);
            return (
              <li key={camp.id}>
                <Card className={past ? "opacity-70" : ""}>
                  <CardBody>
                    <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-info">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {fmtDate(camp.date)} · {camp.startTime}–{camp.endTime}
                      {past && <span className="ml-auto text-muted">Past</span>}
                    </p>
                    <p className="mt-1.5 font-semibold text-navy">{camp.title}</p>
                    <p className="mt-1 flex items-start gap-1 text-xs text-muted">
                      <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {camp.venue}, {camp.city}
                      {camp.districtName ? ` — ${camp.districtName} district` : ""} — {camp.pincode}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {camp.bloodGroupsNeeded.map((g) => (
                        <span key={g} className="rounded bg-primary-50 px-1.5 py-0.5 text-2xs font-bold text-primary">
                          {bloodGroupLabel(g)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2 border-t border-line pt-3">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(camp)}>
                        Edit
                      </Button>
                      <ConfirmButton label="Delete" onConfirm={() => remove(camp.id)} />
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <CampModal
        open={creating || editing !== null}
        existing={editing}
        busy={busy}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={save}
      />
    </div>
  );
}

function CampModal({
  open,
  existing,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  existing: ApiCamp | null;
  busy: boolean;
  onClose: () => void;
  onSave: (values: CampFormValues, id?: string) => Promise<void>;
}) {
  const { data: districtsData } = useDistricts();
  const [values, setValues] = useState<CampFormValues>(emptyCamp);
  const [validation, setValidation] = useState<string | null>(null);
  const [syncedFor, setSyncedFor] = useState<string | null>(null);

  if (open && existing && syncedFor !== existing.id) {
    setSyncedFor(existing.id);
    setValues({
      title: existing.title,
      venue: existing.venue,
      city: existing.city,
      districtId: existing.districtId ?? "",
      pincode: existing.pincode,
      date: dateInputValue(new Date(existing.date)),
      startTime: existing.startTime,
      endTime: existing.endTime,
      description: existing.description ?? "",
      bloodGroupsNeeded: existing.bloodGroupsNeeded,
    });
  }
  if (!open && syncedFor !== null) setSyncedFor(null);

  const toggleGroup = (group: string) => {
    setValues((v) => ({
      ...v,
      bloodGroupsNeeded: v.bloodGroupsNeeded.includes(group)
        ? v.bloodGroupsNeeded.filter((g) => g !== group)
        : [...v.bloodGroupsNeeded, group],
    }));
  };

  return (
    <Modal open={open} title={existing ? "Edit camp" : "New donation camp"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setValidation(null);
          if (values.bloodGroupsNeeded.length === 0) {
            setValidation("Select at least one blood group needed.");
            return;
          }
          if (!values.districtId) {
            setValidation("Select the camp's district.");
            return;
          }
          void onSave(values, existing?.id);
        }}
      >
        <Field label="Camp title" required htmlFor="c-title">
          <Input
            id="c-title"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          />
        </Field>
        <Field label="Venue" required htmlFor="c-venue">
          <Input
            id="c-venue"
            value={values.venue}
            onChange={(e) => setValues((v) => ({ ...v, venue: e.target.value }))}
          />
        </Field>
        <Field
          label="District"
          required
          htmlFor="c-district"
          hint="Karnataka's 31 districts — camps outside them stay unlisted by district"
        >
          <select
            id="c-district"
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            value={values.districtId}
            onChange={(e) => setValues((v) => ({ ...v, districtId: e.target.value }))}
          >
            <option value="">Select district…</option>
            {(districtsData?.districts ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" required htmlFor="c-city">
            <Input
              id="c-city"
              value={values.city}
              onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
            />
          </Field>
          <Field label="Pincode" required htmlFor="c-pincode">
            <Input
              id="c-pincode"
              inputMode="numeric"
              value={values.pincode}
              onChange={(e) => setValues((v) => ({ ...v, pincode: e.target.value }))}
            />
          </Field>
          <Field label="Date" required htmlFor="c-date">
            <Input
              id="c-date"
              type="date"
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start time" required htmlFor="c-start" hint="24h format, e.g. 09:00">
            <Input
              id="c-start"
              type="time"
              value={values.startTime}
              onChange={(e) => setValues((v) => ({ ...v, startTime: e.target.value }))}
            />
          </Field>
          <Field label="End time" required htmlFor="c-end">
            <Input
              id="c-end"
              type="time"
              value={values.endTime}
              onChange={(e) => setValues((v) => ({ ...v, endTime: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Description (optional)" htmlFor="c-desc">
          <Textarea
            id="c-desc"
            maxLength={600}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-navy">
            Blood groups needed <span className="text-danger">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {BLOOD_GROUPS.map((g) => (
              <label
                key={g.value}
                className={`cursor-pointer rounded border px-3 py-1.5 text-sm font-bold transition-colors ${
                  values.bloodGroupsNeeded.includes(g.value)
                    ? "border-primary bg-primary-50 text-primary"
                    : "border-line bg-white text-muted hover:border-navy"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={values.bloodGroupsNeeded.includes(g.value)}
                  onChange={() => toggleGroup(g.value)}
                />
                {g.label}
              </label>
            ))}
          </div>
        </fieldset>

        {validation && <p className="text-xs font-semibold text-danger" role="alert">{validation}</p>}

        <Button type="submit" loading={busy}>
          {existing ? "Save changes" : "Create camp"}
        </Button>
      </form>
    </Modal>
  );
}

export default function OrgCampsPage() {
  return (
    <ProtectedShell allow={["NGO"]}>
      <CampsInner />
    </ProtectedShell>
  );
}
