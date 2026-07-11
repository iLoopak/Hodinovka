"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, type InvoiceStatus } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatMoney, formatDate } from "@/lib/format";
import { todayIso } from "@/lib/time";
import { invoiceTotal } from "@/lib/invoice";
import { invoiceStatusView, invoiceBadge } from "@/lib/status";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { IconArrowLeft, IconInvoices, IconTrash, IconCheck } from "@/components/icons";

const s = strings.faktury;

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function InvoiceDetail() {
  const router = useRouter();
  const params = useSearchParams();
  const id = Number(params.get("id"));
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayIso()), []);

  const invoice = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().invoices.get(id).then((x) => x ?? null) : null),
    [id]
  );
  const client = useLiveQuery(
    () => (invoice ? getDb().clients.get(invoice.clientId).then((c) => c ?? null) : null),
    [invoice?.clientId]
  );

  if (invoice === undefined || !today) {
    return <p className="loading-text">{strings.common.loading}</p>;
  }
  if (!invoice) {
    return (
      <>
        <Link href="/faktury" className="link-back">
          <IconArrowLeft /> {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  const currency = client?.currency;
  const total = invoiceTotal(invoice.items);

  async function setStatus(status: InvoiceStatus) {
    await getDb().invoices.update(id, { status });
  }

  async function handleDelete() {
    if (!window.confirm(s.deleteConfirm)) return;
    // Uvolníme navázané výkazy zpět mezi nevyfakturované.
    await getDb().timeEntries.where("invoiceId").equals(id).modify({ billed: false, invoiceId: null });
    await getDb().invoices.delete(id);
    router.replace("/faktury");
  }

  return (
    <>
      <Link href="/faktury" className="link-back">
        <IconArrowLeft /> {s.title}
      </Link>

      <div className="detail-hero">
        <span className="monogram" data-size="lg" aria-hidden="true">
          <IconInvoices />
        </span>
        <div>
          <h1 className="tnum">{invoice.invoiceNumber}</h1>
          <div className="dh-context" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {client && <Link href={`/klienti/detail/?id=${client.id}`}>{client.name}</Link>}
            <StatusBadge spec={invoiceBadge(invoiceStatusView(invoice, today))} />
          </div>
        </div>
      </div>

      {/* Změna stavu */}
      <div className="detail-actions">
        {invoice.status === "draft" && (
          <button type="button" className="btn btn-primary" onClick={() => setStatus("vystavena")}>
            {s.markIssued}
          </button>
        )}
        {invoice.status === "vystavena" && (
          <>
            <button type="button" className="btn btn-primary" onClick={() => setStatus("zaplacena")}>
              <IconCheck /> {s.markPaid}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setStatus("draft")}>
              {s.markDraft}
            </button>
          </>
        )}
        {invoice.status === "zaplacena" && (
          <button type="button" className="btn btn-secondary" onClick={() => setStatus("vystavena")}>
            {s.markIssued}
          </button>
        )}
      </div>

      {/* Položky */}
      <section className="panel">
        <SectionHeader title={s.items} />
        {invoice.items.length === 0 ? (
          <p className="muted">{s.noItems}</p>
        ) : (
          <div className="invoice-view">
            {invoice.items.map((it, i) => (
              <div className="invoice-view-row" key={i}>
                <div className="ivr-desc">{it.description}</div>
                <div className="ivr-qty tnum muted">
                  {it.quantity} {it.unit} × {formatMoney(it.unitPrice, currency)}
                </div>
                <div className="ivr-total tnum">{formatMoney(it.quantity * it.unitPrice, currency)}</div>
              </div>
            ))}
          </div>
        )}
        <div className="invoice-total">
          <span>{s.total}</span>
          <span className="tnum">{formatMoney(total, currency)}</span>
        </div>
      </section>

      {/* Údaje */}
      <section className="panel">
        <SectionHeader title={s.detailsTitle} />
        <DetailRow label={s.number} value={<span className="tnum">{invoice.invoiceNumber}</span>} />
        <DetailRow label={s.vs} value={<span className="tnum">{invoice.variabilniSymbol}</span>} />
        <DetailRow label={s.issueDate} value={<span className="tnum">{formatDate(invoice.issueDate)}</span>} />
        <DetailRow label={s.taxableSupplyDate} value={invoice.taxableSupplyDate ? <span className="tnum">{formatDate(invoice.taxableSupplyDate)}</span> : null} />
        <DetailRow label={s.dueDate} value={<span className="tnum">{formatDate(invoice.dueDate)}</span>} />
      </section>

      {/* Export PDF — příští fáze */}
      <section className="panel">
        <EmptyState icon={<IconInvoices />} title={strings.faktury.title} description={s.pdfNote} />
      </section>

      <div className="danger-zone">
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          <IconTrash /> {strings.common.delete}
        </button>
      </div>
    </>
  );
}

export default function FakturaDetailPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <InvoiceDetail />
    </Suspense>
  );
}
