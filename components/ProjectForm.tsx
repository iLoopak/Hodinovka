"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, type Project, type BillingType } from "@/lib/db";
import { strings } from "@/lib/strings";
import { ClientForm } from "@/components/ClientForm";

const s = strings.projekty;

type FormState = {
  clientId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  billingType: BillingType;
  rate: string;
  notes: string;
};

function toFormState(p?: Project, presetClientId?: number): FormState {
  return {
    clientId:
      p?.clientId != null
        ? String(p.clientId)
        : presetClientId != null
        ? String(presetClientId)
        : "",
    name: p?.name ?? "",
    description: p?.description ?? "",
    startDate: p?.startDate ?? "",
    endDate: p?.endDate ?? "",
    billingType: p?.billingType ?? "hourly",
    rate: p?.rate != null ? String(p.rate) : "",
    notes: p?.notes ?? "",
  };
}

export function ProjectForm({
  existing,
  presetClientId,
}: {
  existing?: Project;
  presetClientId?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(existing, presetClientId));
  const [nameError, setNameError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);

  const clients = useLiveQuery(() => getDb().clients.orderBy("name").toArray(), []);
  const lockClient = presetClientId != null || existing != null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onClientChange(value: string) {
    setClientError(null);
    const c = clients?.find((cl) => cl.id === Number(value));
    setForm((f) => ({
      ...f,
      clientId: value,
      rate:
        f.rate.trim() === "" && f.billingType === "hourly" && c?.defaultRate != null
          ? String(c.defaultRate)
          : f.rate,
    }));
  }

  async function handleSubmit() {
    const clientId = Number(form.clientId);
    const name = form.name.trim();
    let bad = false;
    if (!clientId) {
      setClientError(s.clientRequired);
      bad = true;
    }
    if (!name) {
      setNameError(s.nameRequired);
      bad = true;
    }
    if (bad) return;

    setSaving(true);
    const rateNum = form.rate.trim() ? Number(form.rate.replace(",", ".")) : undefined;
    const record: Project = {
      clientId,
      name,
      description: form.description.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || null,
      billingType: form.billingType,
      rate: rateNum != null && !Number.isNaN(rateNum) ? rateNum : undefined,
      notes: form.notes.trim() || undefined,
    };

    const db = getDb();
    if (existing?.id != null) {
      await db.projects.update(existing.id, record);
      router.replace(`/projekty/detail/?id=${existing.id}`);
    } else {
      const id = await db.projects.add(record);
      router.replace(`/projekty/detail/?id=${id}`);
    }
  }

  const rateLabel = form.billingType === "fixed" ? s.fields.rateFixed : s.fields.rateHourly;

  return (
    <div className="form">
      {/* Klient */}
      <div className="field">
        <label htmlFor="client">{s.fields.client} *</label>
        {lockClient ? (
          <input
            id="client"
            value={clients?.find((c) => c.id === Number(form.clientId))?.name ?? ""}
            disabled
          />
        ) : creatingClient ? (
          <div className="inline-create">
            <ClientForm
              submitLabel={strings.klienti.createInline}
              onSaved={(id) => {
                setForm((f) => ({ ...f, clientId: String(id) }));
                setCreatingClient(false);
                setClientError(null);
              }}
              onCancel={() => setCreatingClient(false)}
            />
          </div>
        ) : (
          <select
            id="client"
            value={form.clientId}
            onChange={(e) => {
              if (e.target.value === "__new__") setCreatingClient(true);
              else onClientChange(e.target.value);
            }}
          >
            <option value="">{s.fields.selectClient}</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__new__">+ {strings.klienti.add}</option>
          </select>
        )}
        {!creatingClient && clientError && <p className="field-error">{clientError}</p>}
      </div>

      <div className="field">
        <label htmlFor="name">{s.fields.name} *</label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => {
            set("name", e.target.value);
            if (nameError) setNameError(null);
          }}
        />
        {nameError && <p className="field-error">{nameError}</p>}
      </div>

      <div className="field">
        <label htmlFor="description">{s.fields.description}</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="startDate">{s.fields.startDate}</label>
          <input id="startDate" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="endDate">{s.fields.endDate}</label>
          <input id="endDate" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>{s.fields.billingType}</label>
        <div className="segmented" role="group" aria-label={s.fields.billingType}>
          <button type="button" data-active={form.billingType === "hourly"} onClick={() => set("billingType", "hourly")}>
            {s.fields.hourly}
          </button>
          <button type="button" data-active={form.billingType === "fixed"} onClick={() => set("billingType", "fixed")}>
            {s.fields.fixed}
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="rate">{rateLabel}</label>
        <input
          id="rate"
          inputMode="decimal"
          value={form.rate}
          onChange={(e) => set("rate", e.target.value)}
          placeholder={form.billingType === "fixed" ? "20000" : "800"}
        />
      </div>

      <div className="field">
        <label htmlFor="notes">{s.fields.notes}</label>
        <textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => router.back()} disabled={saving}>
          {strings.common.cancel}
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {strings.common.save}
        </button>
      </div>
    </div>
  );
}
