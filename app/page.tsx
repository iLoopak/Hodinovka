"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { computeUnbilled } from "@/lib/metrics";
import { projectStatus } from "@/lib/project";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { UnbilledHero } from "@/components/dashboard/UnbilledHero";
import { QuickAction } from "@/components/QuickAction";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { TimeEntryList } from "@/components/TimeEntryList";
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

  const unbilled =
    timeEntries && projects && clients
      ? computeUnbilled(timeEntries, projects, clients)
      : { minutes: 0, value: 0, entryCount: 0 };

  const activeProjects =
    projects?.filter((p) => projectStatus(p) === "active").length ?? 0;

  const hasWork = (timeEntries?.length ?? 0) > 0;
  const recentEntries = timeEntries
    ? [...timeEntries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)
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
            href="/faktury"
            icon={<IconInvoices />}
            label={s.newInvoice}
            description={s.newInvoiceDesc}
          />
        </div>

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
          <SectionHeader title={s.attention} />
          <EmptyState
            icon={<IconAlert />}
            title={s.attentionEmpty}
            description={strings.faktury.upcomingHint}
          />
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
