"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatDate, formatMoney } from "@/lib/format";
import { todayIso } from "@/lib/time";
import { billingSummary } from "@/lib/project";
import { projectBadge, invoiceStatusView, invoiceBadge } from "@/lib/status";
import { invoiceTotal } from "@/lib/invoice";
import { computeUnbilled } from "@/lib/metrics";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { TimeEntryList } from "@/components/TimeEntryList";
import { IconArrowLeft, IconEdit, IconTrash, IconFolder, IconWork, IconInvoices, IconPlus } from "@/components/icons";

const s = strings.projekty;

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
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
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayIso()), []);

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
    return <p className="loading-text">{strings.common.loading}</p>;
  }
  if (!project) {
    return (
      <>
        <Link href="/projekty" className="link-back">
          <IconArrowLeft /> {s.title}
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

  const unbilled =
    timeEntries && client
      ? computeUnbilled(timeEntries, [project], [client])
      : { minutes: 0, value: 0, entryCount: 0 };

  const dates =
    project.startDate || project.endDate
      ? `${formatDate(project.startDate) || "…"} – ${formatDate(project.endDate) || "…"}`
      : null;

  return (
    <>
      <Link href="/projekty" className="link-back">
        <IconArrowLeft /> {s.title}
      </Link>

      <div className="detail-hero">
        <span className="monogram" data-size="lg" aria-hidden="true">
          <IconFolder />
        </span>
        <div>
          <h1>{project.name}</h1>
          <div className="dh-context" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {client && (
              <Link href={`/klienti/detail/?id=${client.id}`}>{client.name}</Link>
            )}
            <StatusBadge spec={projectBadge(project)} />
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <Link
          href={`/faktury/nova/?clientId=${project.clientId}&projectId=${id}`}
          className="btn btn-primary"
        >
          <IconInvoices /> {strings.faktury.add}
        </Link>
        <Link href={`/projekty/upravit/?id=${id}`} className="btn btn-secondary">
          <IconEdit /> {strings.common.edit}
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: "var(--space-5)" }}>
        <MetricCard label={s.timeEntries} value={timeEntries?.length ?? 0} />
        <MetricCard label={strings.klienti.unbilled} value={formatMoney(unbilled.value, client?.currency)} />
      </div>

      <section className="panel">
        <SectionHeader title={s.info} />
        <DetailRow label={s.fields.description} value={project.description} />
        <DetailRow label="Období" value={dates ? <span className="tnum">{dates}</span> : null} />
        <DetailRow label={s.fields.billingType} value={billingSummary(project, client?.currency)} />
        <DetailRow label={s.fields.notes} value={project.notes} />
      </section>

      <section className="panel">
        <SectionHeader
          title={s.timeEntries}
          action={{ href: `/vykazy/novy/?projectId=${id}&clientId=${project.clientId}`, label: <><IconPlus size={15} /> {strings.vykazy.add}</> }}
        />
        {timeEntries && timeEntries.length > 0 && client ? (
          <TimeEntryList
            entries={[...timeEntries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10)}
            clients={[client]}
            projects={[project]}
            showClient={false}
          />
        ) : (
          <EmptyState
            icon={<IconWork />}
            title={strings.klienti.noWork}
            description={strings.vykazy.emptyHint}
            actionLabel={strings.vykazy.add}
            actionHref={`/vykazy/novy/?projectId=${id}&clientId=${project.clientId}`}
          />
        )}
      </section>

      <section className="panel">
        <SectionHeader
          title={s.invoices}
          action={{ href: `/faktury/nova/?clientId=${project.clientId}&projectId=${id}`, label: <><IconPlus size={15} /> {strings.faktury.add}</> }}
        />
        {invoices && invoices.length > 0 ? (
          <div className="list">
            {[...invoices]
              .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))
              .map((inv) => (
                <ListRow
                  key={inv.id}
                  href={`/faktury/detail/?id=${inv.id}`}
                  leading={<span className="monogram" aria-hidden="true"><IconInvoices size={18} /></span>}
                  title={<span className="tnum">{inv.invoiceNumber}</span>}
                  subtitle={`splatnost ${formatDate(inv.dueDate)}`}
                  meta={
                    <span className="invoice-meta">
                      <span className="tnum invoice-amount">{formatMoney(invoiceTotal(inv.items), client?.currency)}</span>
                      <StatusBadge spec={invoiceBadge(invoiceStatusView(inv, today))} />
                    </span>
                  }
                  showChevron={false}
                />
              ))}
          </div>
        ) : (
          <EmptyState icon={<IconInvoices />} title={s.noInvoices} description={strings.faktury.emptyHint} />
        )}
      </section>

      <div className="danger-zone">
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          <IconTrash /> {strings.common.delete}
        </button>
      </div>
    </>
  );
}

export default function ProjektDetailPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <ProjectDetail />
    </Suspense>
  );
}
