"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, type InvoiceStatus } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatMoney, formatDate } from "@/lib/format";
import { todayIso } from "@/lib/time";
import { invoiceNet, invoiceVat, invoiceGross, vatRecap, itemVatRate, invoicePayable } from "@/lib/vat";
import { invoiceStatusView, invoiceBadge } from "@/lib/status";
import { PROFILE_ID } from "@/lib/profile";
import { resolveIban, buildSpd, spdMessage } from "@/lib/payment";
import { buildIsdoc } from "@/lib/isdoc";
import { buildInvoiceData, pdfSignature } from "@/lib/pdf/invoiceData";
import { generateInvoicePdf, generateQrMatrix, blobToDataUrl } from "@/lib/pdf/generate";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { IconArrowLeft, IconInvoices, IconTrash, IconCheck, IconDownload, IconShare } from "@/components/icons";

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
  const profile = useLiveQuery(
    () => getDb().businessProfile.get(PROFILE_ID).then((p) => p ?? null),
    []
  );

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);

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
  const withVat = invoice.withVat ?? false;
  const netTotal = invoiceNet(invoice.items);
  const vatTotal = invoiceVat(invoice.items, withVat);
  const grossTotal = invoiceGross(invoice.items, withVat);
  const recap = withVat ? vatRecap(invoice.items) : [];

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

  const invoiceNumber = invoice.invoiceNumber;
  const fileName = `faktura-${invoiceNumber.replace(/[^\w.-]+/g, "-")}.pdf`;

  // Vrátí PDF z cache (pokud se data nezměnila), jinak vygeneruje a uloží.
  async function getOrBuildPdf(): Promise<Blob> {
    const db = getDb();
    const inv = await db.invoices.get(id);
    if (!inv) throw new Error("missing invoice");
    const cl = await db.clients.get(inv.clientId);
    const pr = await db.businessProfile.get(PROFILE_ID);
    const signature = pdfSignature(inv, cl, pr);
    if (inv.pdfBlob && inv.pdfSignature === signature) return inv.pdfBlob;

    const [logoUrl, signatureUrl] = await Promise.all([
      pr?.logo ? blobToDataUrl(pr.logo) : Promise.resolve(undefined),
      pr?.signature ? blobToDataUrl(pr.signature) : Promise.resolve(undefined),
    ]);

    // QR Platba — jen když známe IBAN (vyplněný nebo odvozený z čísla účtu)
    // a je co platit.
    let qr: Awaited<ReturnType<typeof generateQrMatrix>> | undefined;
    const payable = invoicePayable(inv);
    const iban = resolveIban(pr);
    if (iban && payable > 0) {
      const spd = buildSpd({
        iban,
        amount: payable,
        currency: cl?.currency ?? "CZK",
        vs: inv.variabilniSymbol,
        message: spdMessage(inv.invoiceNumber),
      });
      qr = await generateQrMatrix(spd);
    }

    const data = buildInvoiceData(inv, cl, pr, { logoUrl, signatureUrl, qr });
    const blob = await generateInvoicePdf(data);
    await db.invoices.update(id, { pdfBlob: blob, pdfSignature: signature });
    return blob;
  }

  function downloadBlob(blob: Blob, name: string = fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function handleIsdoc() {
    const xml = buildIsdoc(invoice!, client, profile);
    const blob = new Blob([xml], { type: "application/xml" });
    downloadBlob(blob, `faktura-${invoiceNumber.replace(/[^\w.-]+/g, "-")}.isdoc`);
  }

  async function handleDownload() {
    setPdfBusy(true);
    setPdfMsg(null);
    try {
      downloadBlob(await getOrBuildPdf());
    } catch (err) {
      console.error("PDF export selhal:", err);
      setPdfMsg(s.pdfError);
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleShare() {
    setPdfBusy(true);
    setPdfMsg(null);
    try {
      const blob = await getOrBuildPdf();
      const file = new File([blob], fileName, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: s.mailSubject(invoiceNumber) });
      } else {
        // Fallback (desktop): stáhnout PDF a otevřít předvyplněný e-mail.
        downloadBlob(blob);
        const subject = encodeURIComponent(s.mailSubject(invoiceNumber));
        const body = encodeURIComponent(s.mailBody(invoiceNumber));
        window.location.href = `mailto:${client?.email ?? ""}?subject=${subject}&body=${body}`;
        setPdfMsg(s.pdfManualAttach);
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("PDF sdílení selhalo:", err);
        setPdfMsg(s.pdfError);
      }
    } finally {
      setPdfBusy(false);
    }
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
                  {withVat ? ` · ${s.itemVat} ${itemVatRate(it)} %` : ""}
                </div>
                <div className="ivr-total tnum">{formatMoney(it.quantity * it.unitPrice, currency)}</div>
              </div>
            ))}
          </div>
        )}
        {withVat ? (
          <div className="invoice-total-vat">
            <div className="itv-row">
              <span>{s.totalNet}</span>
              <span className="tnum">{formatMoney(netTotal, currency)}</span>
            </div>
            {recap.map((r) => (
              <div className="itv-row" key={r.rate}>
                <span>
                  {s.vatAmount} {r.rate} %
                </span>
                <span className="tnum">{formatMoney(r.vat, currency)}</span>
              </div>
            ))}
            <div className="invoice-total">
              <span>{s.totalGross}</span>
              <span className="tnum">{formatMoney(grossTotal, currency)}</span>
            </div>
          </div>
        ) : (
          <div className="invoice-total">
            <span>{s.total}</span>
            <span className="tnum">{formatMoney(netTotal, currency)}</span>
          </div>
        )}
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

      {/* Export PDF */}
      <section className="panel">
        <SectionHeader title={s.exportTitle} />
        <div className="pdf-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownload}
            disabled={pdfBusy}
          >
            <IconDownload /> {s.pdfDownload}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleIsdoc}
            disabled={pdfBusy}
          >
            <IconDownload /> {s.isdocDownload}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleShare}
            disabled={pdfBusy}
          >
            <IconShare /> {s.pdfShare}
          </button>
        </div>
        {pdfBusy && <p className="field-hint">{s.pdfGenerating}</p>}
        {pdfMsg && <p className="field-hint">{pdfMsg}</p>}
        {profile && !profile.name && <p className="field-hint">{s.pdfProfileHint}</p>}
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
