"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, type Invoice, type InvoiceItem } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatMoney } from "@/lib/format";
import { todayIso, addDays, previousMonthRange, isInRange } from "@/lib/time";
import {
  buildInvoiceItems,
  defaultInvoiceNumber,
  invoiceNumberToVs,
  type AggregationMode,
} from "@/lib/invoice";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowLeft, IconPlus, IconTrash } from "@/components/icons";

const s = strings.faktury;

type EditItem = { description: string; quantity: string; unit: string; unitPrice: string };

const parseNum = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const toEdit = (it: InvoiceItem): EditItem => ({
  description: it.description,
  quantity: String(it.quantity),
  unit: it.unit,
  unitPrice: String(it.unitPrice),
});

function NovaFaktura() {
  const router = useRouter();
  const params = useSearchParams();
  const presetClientId = params.get("clientId");
  const presetProjectId = params.get("projectId");

  const clients = useLiveQuery(() => getDb().clients.orderBy("name").toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.orderBy("name").toArray(), []);
  const entriesAll = useLiveQuery(() => getDb().timeEntries.toArray(), []);
  const invoices = useLiveQuery(() => getDb().invoices.toArray(), []);

  const [clientId, setClientId] = useState(presetClientId ?? "");
  const [projectId, setProjectId] = useState(presetProjectId ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<AggregationMode>("perProject");

  const [items, setItems] = useState<EditItem[]>([]);
  const [includedIds, setIncludedIds] = useState<number[]>([]);
  const [generated, setGenerated] = useState(false);

  const [number, setNumber] = useState("");
  const [vs, setVs] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [taxableSupplyDate, setTaxableSupplyDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const didAuto = useRef(false);

  // Výchozí rozsah: od začátku minulého měsíce do dneška — ať se nevynechá
  // práce zapsaná v aktuálním měsíci (fakturovat lze i rozdělanou práci).
  useEffect(() => {
    const t = todayIso();
    setFrom(previousMonthRange().from);
    setTo(t);
    setIssueDate(t);
    setTaxableSupplyDate(t);
    setDueDate(addDays(t, 14));
  }, []);

  // Výchozí číslo faktury (jednou, po načtení faktur).
  useEffect(() => {
    if (invoices && issueDate && number === "") {
      const n = defaultInvoiceNumber(invoices, issueDate);
      setNumber(n);
      setVs(invoiceNumberToVs(n));
    }
  }, [invoices, issueDate, number]);

  const client = clients?.find((c) => c.id === Number(clientId));
  const clientProjects = projects?.filter((p) => p.clientId === Number(clientId)) ?? [];

  function generate() {
    if (!clientId || !entriesAll || !client) return;
    const cid = Number(clientId);
    const pid = projectId ? Number(projectId) : null;
    const candidates = entriesAll.filter(
      (e) =>
        !e.billed &&
        e.clientId === cid &&
        isInRange(e.date, from, to) &&
        (pid == null || e.projectId === pid)
    );
    const scoped = pid != null ? projects?.find((p) => p.id === pid) : undefined;
    const built = buildInvoiceItems({
      entries: candidates,
      scopedProject: scoped,
      projects: projects ?? [],
      client,
      mode,
    });
    setItems(built.map(toEdit));
    setIncludedIds(candidates.map((e) => e.id!).filter((x) => x != null));
    setGenerated(true);
  }

  // Automaticky načíst, když klient přišel z odkazu.
  useEffect(() => {
    if (didAuto.current || !presetClientId) return;
    if (!entriesAll || !clients || !projects || !from || !to) return;
    didAuto.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetClientId, entriesAll, clients, projects, from, to]);

  function setItem(i: number, patch: Partial<EditItem>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((arr) => [...arr, { description: "", quantity: "1", unit: "h", unitPrice: "" }]);
  }
  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((sum, it) => sum + parseNum(it.quantity) * parseNum(it.unitPrice), 0);

  async function save() {
    setError(null);
    if (!clientId) {
      setError(s.clientRequired);
      return;
    }
    const finalItems: InvoiceItem[] = items
      .filter((it) => it.description.trim() || parseNum(it.quantity) || parseNum(it.unitPrice))
      .map((it) => ({
        description: it.description.trim(),
        quantity: parseNum(it.quantity),
        unit: it.unit.trim() || "h",
        unitPrice: parseNum(it.unitPrice),
      }));
    if (finalItems.length === 0) {
      setError(s.itemsRequired);
      return;
    }

    setSaving(true);
    const record: Invoice = {
      invoiceNumber: number.trim(),
      clientId: Number(clientId),
      projectId: projectId ? Number(projectId) : null,
      issueDate,
      taxableSupplyDate: taxableSupplyDate || undefined,
      dueDate,
      variabilniSymbol: vs.trim(),
      items: finalItems,
      status: "draft",
      createdFromTimeEntries: includedIds.length > 0,
    };
    const db = getDb();
    const id = (await db.invoices.add(record)) as number;
    // Zahrnuté výkazy označíme jako vyfakturované (proti dvojí fakturaci).
    if (includedIds.length > 0) {
      await db.timeEntries.where("id").anyOf(includedIds).modify({ billed: true, invoiceId: id });
    }
    router.replace(`/faktury/detail/?id=${id}`);
  }

  const backHref = presetProjectId
    ? `/projekty/detail/?id=${presetProjectId}`
    : presetClientId
    ? `/klienti/detail/?id=${presetClientId}`
    : "/faktury";

  const loading = clients === undefined || projects === undefined || entriesAll === undefined;

  return (
    <>
      <Link href={backHref} className="link-back">
        <IconArrowLeft /> {strings.common.back}
      </Link>
      <PageHeader title={s.newTitle} />

      {loading ? (
        <p className="loading-text">{strings.common.loading}</p>
      ) : (
        <div className="form">
          {/* Zdroj: klient / projekt / období / rozdělení */}
          <section className="panel">
            <div className="section-header">
              <h2>{s.params}</h2>
            </div>

            <div className="field">
              <label htmlFor="client">{strings.vykazy.fields.client} *</label>
              {presetClientId ? (
                <input id="client" value={client?.name ?? ""} disabled />
              ) : (
                <select
                  id="client"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setProjectId("");
                    setGenerated(false);
                  }}
                >
                  <option value="">{strings.vykazy.fields.selectClient}</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="field">
              <label htmlFor="project">{strings.vykazy.fields.project}</label>
              <select
                id="project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!clientId || !!presetProjectId}
              >
                <option value="">{s.allClientProjects}</option>
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="from">{s.rangeFrom}</label>
                <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="to">{s.rangeTo}</label>
                <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>{s.mode}</label>
              <div className="segmented" role="group" aria-label={s.mode}>
                <button type="button" data-active={mode === "perProject"} onClick={() => setMode("perProject")}>
                  {s.modePerProject}
                </button>
                <button type="button" data-active={mode === "perEntry"} onClick={() => setMode("perEntry")}>
                  {s.modePerEntry}
                </button>
              </div>
            </div>

            <button type="button" className="btn btn-secondary" onClick={generate} disabled={!clientId}>
              {generated ? s.regenerate : s.generate}
            </button>
            {generated && (
              <p className="field-hint">
                {includedIds.length > 0 ? s.includedCount(includedIds.length) : s.noUnbilled}
              </p>
            )}
          </section>

          {/* Položky */}
          <section className="panel">
            <div className="section-header">
              <h2>{s.itemsTitle}</h2>
              <button type="button" className="section-action" onClick={addItem}>
                <IconPlus size={15} /> {s.addItem}
              </button>
            </div>

            {items.length === 0 ? (
              <p className="muted">{s.noItems}</p>
            ) : (
              <div className="invoice-items">
                {items.map((it, i) => (
                  <div className="invoice-item" key={i}>
                    <input
                      value={it.description}
                      onChange={(e) => setItem(i, { description: e.target.value })}
                      placeholder={s.itemDescription}
                      aria-label={s.itemDescription}
                    />
                    <div className="invoice-item-line">
                      <input
                        className="ii-qty tnum"
                        inputMode="decimal"
                        value={it.quantity}
                        onChange={(e) => setItem(i, { quantity: e.target.value })}
                        placeholder="0"
                        aria-label={s.itemQty}
                      />
                      <input
                        className="ii-unit"
                        value={it.unit}
                        onChange={(e) => setItem(i, { unit: e.target.value })}
                        aria-label={s.itemUnit}
                      />
                      <input
                        className="ii-price tnum"
                        inputMode="decimal"
                        value={it.unitPrice}
                        onChange={(e) => setItem(i, { unitPrice: e.target.value })}
                        placeholder="0"
                        aria-label={s.itemPrice}
                      />
                      <span className="ii-total tnum">
                        {formatMoney(parseNum(it.quantity) * parseNum(it.unitPrice), client?.currency)}
                      </span>
                      <button
                        type="button"
                        className="icon-btn ii-remove"
                        onClick={() => removeItem(i)}
                        aria-label={strings.common.delete}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="invoice-total">
              <span>{s.total}</span>
              <span className="tnum">{formatMoney(total, client?.currency)}</span>
            </div>
          </section>

          {/* Údaje faktury */}
          <section className="panel">
            <div className="section-header">
              <h2>{s.detailsTitle}</h2>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="number">{s.number}</label>
                <input
                  id="number"
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value);
                    setVs(invoiceNumberToVs(e.target.value));
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="vs">{s.vs}</label>
                <input id="vs" inputMode="numeric" value={vs} onChange={(e) => setVs(e.target.value)} />
              </div>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="issue">{s.issueDate}</label>
                <input id="issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="due">{s.dueDate}</label>
                <input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="duzp">{s.taxableSupplyDate}</label>
              <input id="duzp" type="date" value={taxableSupplyDate} onChange={(e) => setTaxableSupplyDate(e.target.value)} />
            </div>
          </section>

          {error && <p className="field-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => router.back()} disabled={saving}>
              {strings.common.cancel}
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {s.save}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function NovaFakturaPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <NovaFaktura />
    </Suspense>
  );
}
