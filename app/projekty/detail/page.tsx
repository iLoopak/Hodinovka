"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatDate } from "@/lib/format";
import { projectStatus, billingSummary } from "@/lib/project";
import { StatusBadge } from "@/components/StatusBadge";

const s = strings.projekty;

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function ProjectDetail() {
  const router = useRouter();
  const params = useSearchParams();
  const id = Number(params.get("id"));

  const project = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().projects.get(id).then((p) => p ?? null) : null),
    [id]
  );
  const timeEntries = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().timeEntries.where("projectId").equals(id).toArray() : []),
    [id]
  );
  const invoices = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().invoices.where("projectId").equals(id).toArray() : []),
    [id]
  );
  const client = useLiveQuery(
    () => (project ? getDb().clients.get(project.clientId).then((c) => c ?? null) : null),
    [project?.clientId]
  );

  if (project === undefined) {
    return <p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>;
  }
  if (!project) {
    return (
      <>
        <Link href="/projekty" className="link-back">
          ← {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  async function handleDelete() {
    const linked = (timeEntries?.length ?? 0) + (invoices?.length ?? 0) > 0;
    const message = linked ? `${s.deleteWarnLinked}\n\n${s.deleteConfirm}` : s.deleteConfirm;
    if (!window.confirm(message)) return;
    await getDb().projects.delete(id);
    router.replace("/projekty");
  }

  const dates =
    project.startDate || project.endDate
      ? `${formatDate(project.startDate) || "…"} – ${formatDate(project.endDate) || "…"}`
      : null;

  return (
    <>
      <Link href="/projekty" className="link-back">
        ← {s.title}
      </Link>
      <header className="page-header with-action">
        <h1>{project.name}</h1>
        <StatusBadge status={projectStatus(project)} />
      </header>

      <section className="detail-section">
        <h2>{s.info}</h2>
        {client && (
          <div className="detail-row">
            <span className="detail-label">{s.fields.client}</span>
            <span className="detail-value">
              <Link href={`/klienti/detail/?id=${client.id}`}>{client.name}</Link>
            </span>
          </div>
        )}
        <DetailRow label={s.fields.description} value={project.description} />
        <DetailRow label="Období" value={dates} />
        <DetailRow label={s.fields.billingType} value={billingSummary(project, client?.currency)} />
        <DetailRow label={s.fields.notes} value={project.notes} />
      </section>

      <section className="detail-section">
        <h2>{s.timeEntries}</h2>
        {timeEntries && timeEntries.length > 0 ? (
          <p style={{ margin: 0 }}>{timeEntries.length}×</p>
        ) : (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>{s.noTimeEntries}</p>
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
        <Link href={`/projekty/upravit/?id=${id}`} className="btn-secondary">
          {strings.common.edit}
        </Link>
        <button type="button" className="btn-secondary btn-danger" onClick={handleDelete}>
          {strings.common.delete}
        </button>
      </div>
      {/* Rychlá akce „Nová faktura" — plná funkce přijde ve Fázi 4/5. */}
      <div style={{ marginTop: 12 }}>
        <button type="button" className="btn-primary" style={{ width: "100%" }} disabled>
          {s.newInvoice}
        </button>
      </div>
    </>
  );
}

export default function ProjektDetailPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>}>
      <ProjectDetail />
    </Suspense>
  );
}
