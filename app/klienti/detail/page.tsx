"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";

const s = strings.klienti;

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function ClientDetail() {
  const router = useRouter();
  const params = useSearchParams();
  const id = Number(params.get("id"));

  // Rozlišujeme "načítá se" (undefined) od "nenalezeno" (null) — Dexie.get()
  // vrací u chybějícího záznamu undefined, což by jinak splynulo s načítáním.
  const client = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().clients.get(id).then((c) => c ?? null) : null),
    [id]
  );
  const projects = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().projects.where("clientId").equals(id).toArray() : []),
    [id]
  );
  const invoices = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().invoices.where("clientId").equals(id).toArray() : []),
    [id]
  );

  if (client === undefined) {
    return <p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>;
  }
  if (client === null || !client) {
    return (
      <>
        <Link href="/klienti" className="link-back">
          ← {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  async function handleDelete() {
    const linked = (projects?.length ?? 0) + (invoices?.length ?? 0) > 0;
    const message = linked ? `${s.deleteWarnLinked}\n\n${s.deleteConfirm}` : s.deleteConfirm;
    if (!window.confirm(message)) return;
    await getDb().clients.delete(id);
    router.replace("/klienti");
  }

  const rate =
    client.defaultRate != null
      ? `${client.defaultRate} ${client.currency}/h`
      : null;

  return (
    <>
      <Link href="/klienti" className="link-back">
        ← {s.title}
      </Link>
      <header className="page-header with-action">
        <h1>{client.name}</h1>
      </header>

      <section className="detail-section">
        <h2>{s.contact}</h2>
        <DetailRow label={s.fields.ico} value={client.ico} />
        <DetailRow label={s.fields.dic} value={client.dic} />
        <DetailRow label={s.fields.address} value={client.address} />
        <DetailRow label={s.fields.email} value={client.email} />
        <DetailRow label={s.fields.phone} value={client.phone} />
        <DetailRow label={s.fields.defaultRate} value={rate} />
        <DetailRow label={s.fields.notes} value={client.notes} />
      </section>

      <section className="detail-section">
        <h2>{s.projects}</h2>
        {projects && projects.length > 0 ? (
          <div className="card-list">
            {projects.map((p) => (
              <div key={p.id} className="card">
                <div className="card-title">{p.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>{s.noProjects}</p>
        )}
      </section>

      <section className="detail-section">
        <h2>{s.invoices}</h2>
        {invoices && invoices.length > 0 ? (
          <div className="card-list">
            {invoices.map((inv) => (
              <div key={inv.id} className="card">
                <div className="card-title">{inv.invoiceNumber}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>{s.noInvoices}</p>
        )}
      </section>

      <div className="form-actions">
        <Link href={`/klienti/upravit/?id=${id}`} className="btn-secondary">
          {strings.common.edit}
        </Link>
        <button type="button" className="btn-secondary btn-danger" onClick={handleDelete}>
          {strings.common.delete}
        </button>
      </div>
      {/* Rychlá akce „Nová faktura" — plná funkce přijde ve Fázi 5. */}
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn-primary" style={{ width: "100%" }} disabled>
          {s.newInvoice}
        </button>
      </div>
    </>
  );
}

export default function KlientDetailPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>}>
      <ClientDetail />
    </Suspense>
  );
}
