"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, type TimeEntry } from "@/lib/db";
import { strings } from "@/lib/strings";
import { todayIso } from "@/lib/time";

const s = strings.vykazy;

type FormState = {
  clientId: string;
  projectId: string; // "" = bez projektu
  date: string;
  hours: string;
  minutes: string;
  description: string;
};

function toFormState(e?: TimeEntry, presetClientId?: number, presetProjectId?: number): FormState {
  return {
    clientId:
      e?.clientId != null
        ? String(e.clientId)
        : presetClientId != null
        ? String(presetClientId)
        : "",
    projectId:
      e?.projectId != null
        ? String(e.projectId)
        : presetProjectId != null
        ? String(presetProjectId)
        : "",
    date: e?.date ?? "",
    hours: e ? String(Math.floor(e.durationMinutes / 60)) : "",
    minutes: e ? String(e.durationMinutes % 60) : "",
    description: e?.description ?? "",
  };
}

export function TimeEntryForm({
  existing,
  presetClientId,
  presetProjectId,
}: {
  existing?: TimeEntry;
  presetClientId?: number;
  presetProjectId?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    toFormState(existing, presetClientId, presetProjectId)
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clients = useLiveQuery(() => getDb().clients.orderBy("name").toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.orderBy("name").toArray(), []);

  // Výchozí datum až po připojení (aby se nezapekl čas buildu).
  useEffect(() => {
    if (!existing) {
      setForm((f) => (f.date ? f : { ...f, date: todayIso() }));
    }
  }, [existing]);

  // Když je předvyplněný projekt, dovodit z něj klienta.
  useEffect(() => {
    if (presetProjectId != null && projects) {
      const p = projects.find((pr) => pr.id === presetProjectId);
      if (p) setForm((f) => (f.clientId ? f : { ...f, clientId: String(p.clientId) }));
    }
  }, [presetProjectId, projects]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const clientProjects =
    projects?.filter((p) => p.clientId === Number(form.clientId)) ?? [];

  function onClientChange(value: string) {
    setClientError(null);
    // Při změně klienta zrušíme projekt, pokud k němu nepatří.
    setForm((f) => {
      const keepProject = clientProjects.some((p) => String(p.id) === f.projectId);
      return { ...f, clientId: value, projectId: keepProject ? f.projectId : "" };
    });
  }

  async function handleSubmit() {
    const clientId = Number(form.clientId);
    const durationMinutes =
      (Number(form.hours) || 0) * 60 + (Number(form.minutes) || 0);

    let bad = false;
    if (!clientId) {
      setClientError(s.clientRequired);
      bad = true;
    }
    if (durationMinutes <= 0) {
      setDurationError(s.durationRequired);
      bad = true;
    }
    if (bad) return;

    setSaving(true);
    const record: TimeEntry = {
      clientId,
      projectId: form.projectId ? Number(form.projectId) : null,
      date: form.date || todayIso(),
      durationMinutes,
      description: form.description.trim() || undefined,
      billed: existing?.billed ?? false,
      invoiceId: existing?.invoiceId ?? null,
    };

    const db = getDb();
    if (existing?.id != null) {
      await db.timeEntries.update(existing.id, record);
    } else {
      await db.timeEntries.add(record);
    }
    router.replace("/vykazy");
  }

  return (
    <div className="form">
      <div className="field">
        <label htmlFor="client">{s.fields.client} *</label>
        <select
          id="client"
          value={form.clientId}
          onChange={(e) => onClientChange(e.target.value)}
        >
          <option value="">{s.fields.selectClient}</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {clientError && <p className="field-error">{clientError}</p>}
        {clients && clients.length === 0 && (
          <p className="field-hint">{strings.projekty.noClients}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="project">{s.fields.project}</label>
        <select
          id="project"
          value={form.projectId}
          onChange={(e) => set("projectId", e.target.value)}
          disabled={!form.clientId}
        >
          <option value="">{s.fields.noProject}</option>
          {clientProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="date">{s.fields.date}</label>
        <input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="hours">{s.fields.duration} *</label>
        <div className="duration-inputs">
          <div className="duration-part">
            <input
              id="hours"
              inputMode="numeric"
              value={form.hours}
              onChange={(e) => {
                set("hours", e.target.value);
                if (durationError) setDurationError(null);
              }}
              placeholder="0"
              aria-label={s.fields.hours}
            />
            <span>{s.fields.hours}</span>
          </div>
          <div className="duration-part">
            <input
              inputMode="numeric"
              value={form.minutes}
              onChange={(e) => {
                set("minutes", e.target.value);
                if (durationError) setDurationError(null);
              }}
              placeholder="0"
              aria-label={s.fields.minutes}
            />
            <span>{s.fields.minutes}</span>
          </div>
        </div>
        {durationError && <p className="field-error">{durationError}</p>}
      </div>

      <div className="field">
        <label htmlFor="description">{s.fields.description}</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
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
