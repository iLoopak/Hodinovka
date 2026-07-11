"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatMoney } from "@/lib/format";
import { billingSummary } from "@/lib/project";
import { projectBadge } from "@/lib/status";
import { computeUnbilled } from "@/lib/metrics";
import { SectionHeader } from "@/components/SectionHeader";
import { Monogram } from "@/components/Monogram";
import { ListRow } from "@/components/ListRow";
import { TimeEntryList } from "@/components/TimeEntryList";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { IconPlus, IconEdit, IconTrash, IconFolder, IconWork, IconInvoices, IconArrowLeft } from "@/components/icons";

const s = strings.klienti;

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
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

  const client = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().clients.get(id).then((c) => c ?? null) : null),
    [id]
  );
  const projects = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().projects.where("clientId").equals(id).toArray() : []),
    [id]
  );
  const timeEntries = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().timeEntries.where("clientId").equals(id).toArray() : []),
    [id]
  );
  const invoices = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().invoices.where("clientId").equals(id).toArray() : []),
    [id]
  );

  if (client === undefined) {
    return <p className="loading-text">{strings.common.loading}</p>;
  }
  if (!client) {
    return (
      <>
        <Link href="/klienti" className="link-back">
          <IconArrowLeft /> {s.title}
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

  const unbilled =
    timeEntries && projects
      ? computeUnbilled(timeEntries, projects, [client])
      : { minutes: 0, value: 0, entryCount: 0 };

  const streetLine = [client.street, client.streetNumber].filter(Boolean).join(" ");
  const cityLine = [client.zip, client.city].filter(Boolean).join(" ");
  const addressLines = [streetLine, cityLine].filter(Boolean);
  const context =
    projects && projects.length > 0
      ? `${projects.length} ${pluralProjects(projects.length)}`
      : client.city || (client.ico ? `IČO ${client.ico}` : strings.app.tagline);

  return (
    <>
      <Link href="/klienti" className="link-back">
        <IconArrowLeft /> {s.title}
      </Link>

      <div className="detail-hero">
        <Monogram name={client.name} size="lg" />
        <div>
          <h1>{client.name}</h1>
          <div className="dh-context">{context}</div>
        </div>
      </div>

      {/* Primární akce — pozitivní, funkční (žádné zavádějící zakázané tlačítko). */}
      <div className="detail-actions">
        <Link href={`/projekty/novy/?clientId=${id}`} className="btn btn-primary">
          <IconPlus /> {s.newProject}
        </Link>
        <Link href={`/klienti/upravit/?id=${id}`} className="btn btn-secondary">
          <IconEdit /> {strings.common.edit}
        </Link>
      </div>

      {/* Provozní souhrn */}
      <div className="stat-grid" style={{ marginBottom: "var(--space-5)" }}>
        <MetricCard label={s.projects} value={projects?.length ?? 0} />
        <MetricCard label={s.unbilled} value={formatMoney(unbilled.value, client.currency)} />
      </div>

      {/* Projekty */}
      <section className="panel">
        <SectionHeader
          title={s.projects}
          action={{ href: `/projekty/novy/?clientId=${id}`, label: <><IconPlus size={15} /> {s.newProject}</> }}
        />
        {projects && projects.length > 0 ? (
          <div className="list">
            {projects.map((p) => (
              <ListRow
                key={p.id}
                href={`/projekty/detail/?id=${p.id}`}
                leading={<span className="monogram" aria-hidden="true"><IconFolder size={18} /></span>}
                title={p.name}
                subtitle={billingSummary(p, client.currency)}
                meta={<StatusBadge spec={projectBadge(p)} />}
                showChevron={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<IconFolder />} title={s.noProjects} description={s.noProjectsHint} />
        )}
      </section>

      {/* Výkazy práce */}
      <section className="panel">
        <SectionHeader
          title={s.work}
          action={{ href: `/vykazy/novy/?clientId=${id}`, label: <><IconPlus size={15} /> {strings.vykazy.add}</> }}
        />
        {timeEntries && timeEntries.length > 0 ? (
          <TimeEntryList
            entries={[...timeEntries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10)}
            clients={[client]}
            projects={projects ?? []}
            showClient={false}
          />
        ) : (
          <EmptyState
            icon={<IconWork />}
            title={s.noWork}
            description={strings.vykazy.emptyHint}
            actionLabel={strings.vykazy.add}
            actionHref={`/vykazy/novy/?clientId=${id}`}
          />
        )}
      </section>

      {/* Faktury — funkce přijde ve Fázi 4/5 */}
      <section className="panel">
        <SectionHeader title={s.invoices} />
        <EmptyState icon={<IconInvoices />} title={s.noInvoices} description={strings.faktury.upcomingHint} />
      </section>

      {/* Kontakt a fakturační údaje — nižší priorita */}
      <section className="panel">
        <SectionHeader title={s.contactBilling} />
        <DetailRow label={s.fields.ico} value={client.ico} />
        <DetailRow label={s.fields.dic} value={client.dic} />
        <DetailRow
          label={s.fields.address}
          value={
            addressLines.length > 0
              ? addressLines.map((line) => <div key={line}>{line}</div>)
              : null
          }
        />
        <DetailRow label={s.fields.email} value={client.email} />
        <DetailRow label={s.fields.phone} value={client.phone} />
        <DetailRow
          label={s.fields.defaultRate}
          value={
            client.defaultRate != null ? (
              <span className="tnum">{`${client.defaultRate} ${client.currency}/h`}</span>
            ) : null
          }
        />
        <DetailRow label={s.fields.notes} value={client.notes} />
      </section>

      {/* Zóna nebezpečí — oddělené destruktivní akce */}
      <div className="danger-zone">
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          <IconTrash /> {strings.common.delete}
        </button>
      </div>
    </>
  );
}

function pluralProjects(n: number): string {
  if (n === 1) return "projekt";
  if (n >= 2 && n <= 4) return "projekty";
  return "projektů";
}

export default function KlientDetailPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <ClientDetail />
    </Suspense>
  );
}
