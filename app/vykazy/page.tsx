"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatMoney, formatDuration } from "@/lib/format";
import { computeUnbilled } from "@/lib/metrics";
import { currentMonth, formatMonth, isInMonth, shiftMonth } from "@/lib/time";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TimeEntryList } from "@/components/TimeEntryList";
import { MetricCard } from "@/components/MetricCard";
import { IconPlus, IconWork, IconArrowRight, IconArrowLeft } from "@/components/icons";

const s = strings.vykazy;

export default function VykazyPage() {
  const [month, setMonth] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterProject, setFilterProject] = useState("");

  useEffect(() => setMonth(currentMonth()), []);

  const entries = useLiveQuery(() => getDb().timeEntries.toArray(), []);
  const clients = useLiveQuery(() => getDb().clients.orderBy("name").toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.orderBy("name").toArray(), []);

  const addButton = (
    <Link href="/vykazy/novy" className="btn btn-primary">
      <IconPlus />
      {s.add}
    </Link>
  );

  // Projekty do filtru (podle zvoleného klienta).
  const filterProjects =
    projects?.filter((p) => !filterClient || p.clientId === Number(filterClient)) ?? [];

  const filtered =
    entries?.filter(
      (e) =>
        (!month || isInMonth(e.date, month)) &&
        (!filterClient || e.clientId === Number(filterClient)) &&
        (!filterProject || e.projectId === Number(filterProject))
    ) ?? [];

  const totalMinutes = filtered.reduce((sum, e) => sum + e.durationMinutes, 0);
  const unbilled =
    projects && clients ? computeUnbilled(filtered, projects, clients) : { value: 0, minutes: 0, entryCount: 0 };

  const loading = entries === undefined || clients === undefined || projects === undefined || !month;

  return (
    <>
      <PageHeader title={s.title} action={addButton} />

      {loading ? (
        <p className="loading-text">{strings.common.loading}</p>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<IconWork />}
          title={s.empty}
          description={s.emptyHint}
          actionLabel={s.add}
          actionHref="/vykazy/novy"
        />
      ) : (
        <>
          {/* Přepínač měsíce */}
          <div className="month-switch">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              aria-label="Předchozí měsíc"
            >
              <IconArrowLeft />
            </button>
            <span className="ms-label tnum">{formatMonth(month)}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              aria-label="Další měsíc"
            >
              <IconArrowRight />
            </button>
          </div>

          {/* Filtry */}
          <div className="filters">
            <div className="field">
              <label htmlFor="fc">{strings.vykazy.fields.client}</label>
              <select
                id="fc"
                value={filterClient}
                onChange={(e) => {
                  setFilterClient(e.target.value);
                  setFilterProject("");
                }}
              >
                <option value="">{s.allClients}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="fp">{strings.vykazy.fields.project}</label>
              <select
                id="fp"
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
              >
                <option value="">{s.allProjects}</option>
                {filterProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Souhrn */}
          <div className="summary-row">
            <MetricCard label={s.summaryHours} value={formatDuration(totalMinutes)} />
            <MetricCard label={s.summaryUnbilled} value={formatMoney(unbilled.value)} />
          </div>

          {/* Seznam */}
          {filtered.length === 0 ? (
            <EmptyState icon={<IconWork />} title={s.emptyMonth} description={s.emptyMonthHint} />
          ) : (
            <TimeEntryList entries={filtered} clients={clients} projects={projects} />
          )}
        </>
      )}
    </>
  );
}
