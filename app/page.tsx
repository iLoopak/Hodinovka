"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { computeUnbilled, unbilledByClient } from "@/lib/metrics";
import { projectStatus } from "@/lib/project";
import { isoDateFromTs } from "@/lib/time";
import { invoiceTotal } from "@/lib/invoice";
import { invoiceStatusView, invoiceBadge } from "@/lib/status";
import { formatMoney, formatDate, formatHours } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { UnbilledHero } from "@/components/dashboard/UnbilledHero";
import { QuickAction } from "@/components/QuickAction";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { TimeEntryList } from "@/components/TimeEntryList";
import { ListRow } from "@/components/ListRow";
import { Monogram } from "@/components/Monogram";
import { StatusBadge } from "@/components/StatusBadge";
import { IconWork, IconInvoices, IconInbox, IconAlert } from "@/components/icons";

const s = strings.prehled;

const MONTHS = [
  "leden", "únor", "březen", "duben", "květen", "červen",
  "červenec", "srpen", "září", "říjen", "listopad", "prosinec",
];

function greeting(hour: number): string {
  if (hour < 10) return s.greetingMorning;
  if (hour >= 18) return s.greetingEvening;
  return s.greetingDay;
}

export default function PrehledPage() {
  // Datum/čas počítáme až po připojení, aby nedošlo k neshodě při hydrataci
  // (statický build by jinak zapekl čas buildu).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const clients = useLiveQuery(() => getDb().clients.toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.toArray(), []);
  const timeEntries = useLiveQuery(() => getDb().timeEntries.toArray(), []);
  const invoices = useLiveQuery(() => getDb().invoices.toArray(), []);

  const unbilled =
    timeEntries && projects && clients
      ? computeUnbilled(timeEntries, projects, clients)
      : { minutes: 0, value: 0, entryCount: 0 };

  const perClient =
    timeEntries && projects && clients
      ? unbilledByClient(timeEntries, projects, clients)
      : [];

  const activeProjects =
    projects?.filter((p) => projectStatus(p) === "active").length ?? 0;

  const hasWork = (timeEntries?.length ?? 0) > 0;
  const recentEntries = timeEntries
    ? [...timeEntries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)
    : [];

  // Faktury vyžadující pozornost: vystavené po splatnosti / blížící se splatnosti.
  const today = now ? isoDateFromTs(now.getTime()) : "";
  const attention =
    invoices && today
      ? invoices
          .filter((inv) => {
            const v = invoiceStatusView(inv, today);
            return v === "overdue" || v === "dueSoon";
          })
          .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
      : [];

  const monthLabel = now
    ? `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
    : "";
  const eyebrow = now ? greeting(now.getHours()) : "";

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={s.title}
        subtitle={
          monthLabel ? (
            <span className="tnum" style={{ textTransform: "capitalize" }}>
              {monthLabel}
            </span>
          ) : undefined
        }
      />

      <div className="stack">
        <UnbilledHero
          hasWork={unbilled.entryCount > 0}
          value={unbilled.value}
          minutes={unbilled.minutes}
        />

        <div className="quick-actions">
          <QuickAction
            href="/vykazy/novy"
            icon={<IconWork />}
            label={s.logWork}
            description={s.logWorkDesc}
          />
          <QuickAction
            href="/faktury/nova"
            icon={<IconInvoices />}
            label={s.newInvoice}
            description={s.newInvoiceDesc}
          />
        </div>

        {perClient.length > 0 && (
          <section>
            <SectionHeader title={s.unbilledByClient} />
            <div className="list">
              {perClient.map(({ client, minutes, value }) => (
                <ListRow
                  key={client.id}
                  href={`/klienti/detail/?id=${client.id}`}
                  leading={<Monogram name={client.name} />}
                  title={client.name}
                  subtitle={<span className="tnum">{formatHours(minutes)} h</span>}
                  meta={<span className="tnum invoice-amount">{formatMoney(value, client.currency)}</span>}
                  showChevron={false}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader
            title={s.recentWork}
            action={hasWork ? { href: "/vykazy", label: s.viewAll } : undefined}
          />
          {hasWork ? (
            <TimeEntryList
              entries={recentEntries}
              clients={clients ?? []}
              projects={projects ?? []}
            />
          ) : (
            <EmptyState
              icon={<IconInbox />}
              title={s.recentWorkEmpty}
              description={strings.vykazy.emptyHint}
              actionLabel={s.logWork}
              actionHref="/vykazy/novy"
            />
          )}
        </section>

        <section>
          <SectionHeader
            title={s.attention}
            action={attention.length > 0 ? { href: "/faktury", label: s.viewAll } : undefined}
          />
          {attention.length > 0 ? (
            <div className="list">
              {attention.map((inv) => {
                const client = clients?.find((c) => c.id === inv.clientId);
                return (
                  <ListRow
                    key={inv.id}
                    href={`/faktury/detail/?id=${inv.id}`}
                    leading={<span className="monogram" aria-hidden="true"><IconInvoices size={18} /></span>}
                    title={<span className="tnum">{inv.invoiceNumber}</span>}
                    subtitle={`${client?.name ?? ""} · splatnost ${formatDate(inv.dueDate)}`}
                    meta={
                      <span className="invoice-meta">
                        <span className="tnum invoice-amount">{formatMoney(invoiceTotal(inv.items), client?.currency)}</span>
                        <StatusBadge spec={invoiceBadge(invoiceStatusView(inv, today))} />
                      </span>
                    }
                    showChevron={false}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<IconAlert />} title={s.attentionEmpty} />
          )}
        </section>

        <section>
          <SectionHeader title={s.summary} />
          <div className="stat-grid">
            <MetricCard label={s.statsClients} value={clients?.length ?? 0} />
            <MetricCard label={s.statsProjects} value={activeProjects} />
            <MetricCard
              label={s.statsUnbilledHours}
              value={Math.round((unbilled.minutes / 60) * 10) / 10}
            />
          </div>
        </section>
      </div>
    </>
  );
}
