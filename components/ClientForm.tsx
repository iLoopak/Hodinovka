"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDb, type Client } from "@/lib/db";
import { fetchAresByIco, AresError } from "@/lib/ares";
import { strings } from "@/lib/strings";

const s = strings.klienti;

type FormState = {
  name: string;
  ico: string;
  dic: string;
  address: string;
  email: string;
  phone: string;
  defaultRate: string; // v UI jako text, převádíme až při uložení
  currency: string;
  notes: string;
};

function toFormState(client?: Client): FormState {
  return {
    name: client?.name ?? "",
    ico: client?.ico ?? "",
    dic: client?.dic ?? "",
    address: client?.address ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    defaultRate: client?.defaultRate != null ? String(client.defaultRate) : "",
    currency: client?.currency ?? "CZK",
    notes: client?.notes ?? "",
  };
}

export function ClientForm({ existing }: { existing?: Client }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(existing));
  const [nameError, setNameError] = useState<string | null>(null);
  const [aresLoading, setAresLoading] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAres() {
    setAresError(null);
    setAresLoading(true);
    try {
      const r = await fetchAresByIco(form.ico);
      // Přepíšeme jen pole, která ARES vrátil; zbytek necháme být.
      setForm((f) => ({
        ...f,
        name: r.name || f.name,
        address: r.address || f.address,
        dic: r.dic ?? f.dic,
        ico: r.ico || f.ico,
      }));
      setNameError(null);
    } catch (err) {
      setAresError(
        err instanceof AresError ? err.message : "Načtení z ARES selhalo."
      );
    } finally {
      setAresLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      address: form.address.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      defaultRate: rateNum != null && !Number.isNaN(rateNum) ? rateNum : undefined,
      currency: form.currency.trim() || "CZK",
      notes: form.notes.trim() || undefined,
    };

    const db = getDb();
    if (existing?.id != null) {
      await db.clients.update(existing.id, record);
      router.replace(`/klienti/detail/?id=${existing.id}`);
    } else {
      const id = await db.clients.add(record);
      router.replace(`/klienti/detail/?id=${id}`);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {/* IČO + načtení z ARES */}
      <div className="field-inline">
        <div className="field">
          <label htmlFor="ico">{s.fields.ico}</label>
          <input
            id="ico"
            inputMode="numeric"
            value={form.ico}
            onChange={(e) => set("ico", e.target.value)}
            placeholder="12345678"
          />
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleAres}
          disabled={aresLoading}
        >
          {aresLoading ? s.fields.loading : s.fields.loadFromAres}
        </button>
      </div>
      {aresError && <p className="field-error">{aresError}</p>}

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
        <label htmlFor="dic">{s.fields.dic}</label>
        <input id="dic" value={form.dic} onChange={(e) => set("dic", e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="address">{s.fields.address}</label>
        <textarea
          id="address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="email">{s.fields.email}</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="phone">{s.fields.phone}</label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>

      <div className="field-inline">
        <div className="field">
          <label htmlFor="rate">{s.fields.defaultRate}</label>
          <input
            id="rate"
            inputMode="decimal"
            value={form.defaultRate}
            onChange={(e) => set("defaultRate", e.target.value)}
            placeholder="800"
          />
        </div>
        <div className="field" style={{ maxWidth: 110 }}>
          <label htmlFor="currency">{s.fields.currency}</label>
          <input
            id="currency"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">{s.fields.notes}</label>
        <textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={saving}
        >
          {strings.common.cancel}
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {strings.common.save}
        </button>
      </div>
    </form>
  );
}
