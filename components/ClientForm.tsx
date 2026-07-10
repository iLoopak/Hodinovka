"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDb, type Client } from "@/lib/db";
import { fetchAresByIco, AresError } from "@/lib/ares";
import { strings } from "@/lib/strings";
import { IconSearch } from "@/components/icons";

const s = strings.klienti;

type FormState = {
  name: string;
  ico: string;
  dic: string;
  street: string;
  streetNumber: string;
  city: string;
  zip: string;
  email: string;
  phone: string;
  defaultRate: string;
  currency: string;
  notes: string;
};

// Pole, která umí doplnit ARES (pro jemné potvrzení po načtení).
type AresFillable = "name" | "dic" | "street" | "streetNumber" | "city" | "zip";

function toFormState(client?: Client): FormState {
  return {
    name: client?.name ?? "",
    ico: client?.ico ?? "",
    dic: client?.dic ?? "",
    street: client?.street ?? "",
    streetNumber: client?.streetNumber ?? "",
    city: client?.city ?? "",
    zip: client?.zip ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    defaultRate: client?.defaultRate != null ? String(client.defaultRate) : "",
    currency: client?.currency ?? "CZK",
    notes: client?.notes ?? "",
  };
}

export function ClientForm({
  existing,
  onSaved,
  onCancel,
  submitLabel,
}: {
  existing?: Client;
  onSaved?: (id: number) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(existing));
  const [nameError, setNameError] = useState<string | null>(null);
  const [aresLoading, setAresLoading] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [filled, setFilled] = useState<Partial<Record<AresFillable, boolean>>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAres() {
    setAresError(null);
    setAresLoading(true);
    try {
      const r = await fetchAresByIco(form.ico);
      setForm((f) => ({
        ...f,
        name: r.name || f.name,
        street: r.street || f.street,
        streetNumber: r.streetNumber || f.streetNumber,
        city: r.city || f.city,
        zip: r.zip || f.zip,
        dic: r.dic ?? f.dic,
        ico: r.ico || f.ico,
      }));
      const just: Partial<Record<AresFillable, boolean>> = {};
      if (r.name) just.name = true;
      if (r.dic) just.dic = true;
      if (r.street) just.street = true;
      if (r.streetNumber) just.streetNumber = true;
      if (r.city) just.city = true;
      if (r.zip) just.zip = true;
      setFilled(just);
      setNameError(null);
      // Potvrzení po chvíli zmizí (jemné, ne rušivé).
      window.setTimeout(() => setFilled({}), 1600);
    } catch (err) {
      setAresError(err instanceof AresError ? err.message : "Načtení z ARES selhalo.");
    } finally {
      setAresLoading(false);
    }
  }

  async function handleSubmit() {
    const name = form.name.trim();
    if (!name) {
      setNameError(s.nameRequired);
      return;
    }
    setSaving(true);
    const rateNum = form.defaultRate.trim()
      ? Number(form.defaultRate.replace(",", "."))
      : undefined;

    const record: Client = {
      name,
      ico: form.ico.trim() || undefined,
      dic: form.dic.trim() || undefined,
      street: form.street.trim() || undefined,
      streetNumber: form.streetNumber.trim() || undefined,
      city: form.city.trim() || undefined,
      zip: form.zip.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      defaultRate: rateNum != null && !Number.isNaN(rateNum) ? rateNum : undefined,
      currency: form.currency.trim() || "CZK",
      notes: form.notes.trim() || undefined,
    };

    const db = getDb();
    if (existing?.id != null) {
      await db.clients.update(existing.id, record);
      if (onSaved) onSaved(existing.id);
      else router.replace(`/klienti/detail/?id=${existing.id}`);
    } else {
      const newId = (await db.clients.add(record)) as number;
      if (onSaved) onSaved(newId);
      else router.replace(`/klienti/detail/?id=${newId}`);
    }
  }

  const df = (k: AresFillable) => (filled[k] ? "true" : undefined);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      noValidate
    >
      {/* IČO + ARES jako jedna spojená interakce */}
      <div className="field">
        <label htmlFor="ico">{s.fields.ico}</label>
        <div className="ico-lookup">
          <input
            id="ico"
            inputMode="numeric"
            value={form.ico}
            onChange={(e) => set("ico", e.target.value)}
            placeholder="12345678"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAres}
            disabled={aresLoading}
          >
            <IconSearch />
            {aresLoading ? s.fields.loading : s.fields.loadFromAres}
          </button>
        </div>
        {aresError && <p className="field-error">{aresError}</p>}
      </div>

      <div className="field">
        <label htmlFor="name">{s.fields.name} *</label>
        <input
          id="name"
          value={form.name}
          data-filled={df("name")}
          onChange={(e) => {
            set("name", e.target.value);
            if (nameError) setNameError(null);
          }}
        />
        {nameError && <p className="field-error">{nameError}</p>}
      </div>

      <div className="field">
        <label htmlFor="dic">{s.fields.dic}</label>
        <input id="dic" value={form.dic} data-filled={df("dic")} onChange={(e) => set("dic", e.target.value)} />
      </div>

      <div className="fieldset">
        <div className="fieldset-legend">{s.fields.address}</div>
        <div className="field-grid grow-first">
          <div className="field">
            <label htmlFor="street">{s.fields.street}</label>
            <input id="street" value={form.street} data-filled={df("street")} onChange={(e) => set("street", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="streetNumber">{s.fields.streetNumber}</label>
            <input id="streetNumber" value={form.streetNumber} data-filled={df("streetNumber")} onChange={(e) => set("streetNumber", e.target.value)} placeholder="778/3a" />
          </div>
        </div>
        <div className="field-grid grow-first">
          <div className="field">
            <label htmlFor="city">{s.fields.city}</label>
            <input id="city" value={form.city} data-filled={df("city")} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="zip">{s.fields.zip}</label>
            <input id="zip" inputMode="numeric" value={form.zip} data-filled={df("zip")} onChange={(e) => set("zip", e.target.value)} placeholder="140 00" />
          </div>
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="email">{s.fields.email}</label>
          <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="phone">{s.fields.phone}</label>
          <input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>

      <div className="field-grid grow-first">
        <div className="field">
          <label htmlFor="rate">{s.fields.defaultRate}</label>
          <input id="rate" inputMode="decimal" value={form.defaultRate} onChange={(e) => set("defaultRate", e.target.value)} placeholder="800" />
        </div>
        <div className="field">
          <label htmlFor="currency">{s.fields.currency}</label>
          <input id="currency" value={form.currency} onChange={(e) => set("currency", e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">{s.fields.notes}</label>
        <textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel ?? (() => router.back())}
          disabled={saving}
        >
          {strings.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {submitLabel ?? strings.common.save}
        </button>
      </div>
    </form>
  );
}
