"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  BLOOD_GROUPS,
  COMPONENTS,
  bloodGroupLabel,
  componentLabel,
  type ApiStockRow,
} from "@/lib/constants";
import { useMe } from "@/hooks/useMe";
import { useMyStock } from "@/hooks/useApiData";
import { ProtectedShell } from "@/components/ProtectedShell";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Field, Input, Select } from "@/components/ui/forms";
import { TimeAgo } from "@/components/ui/TimeBits";
import { DropIcon, PlusIcon } from "@/components/ui/icons";

interface StockFormValues {
  bloodGroup: string;
  component: string;
  units: number;
}

function StockInner() {
  const { user } = useMe();
  const { data, mutate } = useMyStock();
  const [editing, setEditing] = useState<ApiStockRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (values: StockFormValues, id?: string) => {
    setBusy(true);
    setError(null);
    try {
      if (id) {
        await api(`/stock/${id}`, { method: "PUT", body: values });
      } else {
        await api("/stock", { method: "POST", body: values });
      }
      await mutate();
      setEditing(null);
      setCreating(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save stock row");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await api(`/stock/${id}`, { method: "DELETE" });
      await mutate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete stock row");
    }
  };

  const orgName = user?.orgProfile?.orgName ?? user?.name ?? "Your organisation";

  return (
    <div className="py-2">
      <PageHeader
        title="Blood stock"
        subtitle={`${orgName} — live units per blood group and component. Changes appear on the public dashboard within 20 seconds.`}
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" />
            Add stock row
          </Button>
        }
      />

      {error && (
        <p className="mb-4 rounded border border-danger/30 bg-primary-50 px-3 py-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {data && data.stock.length === 0 ? (
        <EmptyState
          icon={<DropIcon />}
          title="No stock rows yet"
          hint="Add one row per blood group + component combination you keep in stock."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon className="h-4 w-4" />
              Add stock row
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle text-left text-2xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Blood group</th>
                <th className="px-4 py-3 font-semibold">Component</th>
                <th className="px-4 py-3 font-semibold">Units</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.stock.map((row) => (
                <tr key={row.id} className="hover:bg-subtle/50">
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary-50 px-2 py-0.5 font-bold text-primary">
                      {bloodGroupLabel(row.bloodGroup)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{componentLabel(row.component)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold tabular-nums ${row.units === 0 ? "text-danger" : "text-navy"}`}
                    >
                      {row.units}
                    </span>
                    {row.units === 0 && (
                      <span className="ml-2 text-2xs font-semibold uppercase text-danger">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TimeAgo iso={row.updatedAt} prefix="" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>
                        Edit
                      </Button>
                      <ConfirmButton label="Delete" onConfirm={() => remove(row.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <StockModal
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

function StockModal({
  open,
  existing,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  existing: ApiStockRow | null;
  busy: boolean;
  onClose: () => void;
  onSave: (values: StockFormValues, id?: string) => Promise<void>;
}) {
  const [values, setValues] = useState<StockFormValues>({
    bloodGroup: "O_POS",
    component: "WHOLE_BLOOD",
    units: 1,
  });

  // Sync the form when a different row starts being edited.
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  if (open && existing && syncedFor !== existing.id) {
    setSyncedFor(existing.id);
    setValues({
      bloodGroup: existing.bloodGroup,
      component: existing.component,
      units: existing.units,
    });
  }
  if (!open && syncedFor !== null) setSyncedFor(null);

  return (
    <Modal open={open} title={existing ? "Edit stock row" : "Add stock row"} onClose={onClose}>
      <form
        className="grid gap-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(values, existing?.id);
        }}
      >
        <Field label="Blood group" required htmlFor="st-bg">
          <Select
            id="st-bg"
            value={values.bloodGroup}
            onChange={(e) => setValues((v) => ({ ...v, bloodGroup: e.target.value }))}
          >
            {BLOOD_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Component" required htmlFor="st-component">
          <Select
            id="st-component"
            value={values.component}
            onChange={(e) => setValues((v) => ({ ...v, component: e.target.value }))}
          >
            {COMPONENTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Units" required htmlFor="st-units" hint="0 marks this combination as exhausted">
          <Input
            id="st-units"
            type="number"
            min={0}
            max={500}
            value={values.units}
            onChange={(e) => setValues((v) => ({ ...v, units: Number(e.target.value) }))}
          />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" loading={busy}>
            {existing ? "Save changes" : "Add row"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function OrgStockPage() {
  return (
    <ProtectedShell allow={["NGO", "BLOOD_BANK"]}>
      <StockInner />
    </ProtectedShell>
  );
}
