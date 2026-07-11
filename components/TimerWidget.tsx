"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, type TimeEntry } from "@/lib/db";
import { strings } from "@/lib/strings";
import { isoDateFromTs } from "@/lib/time";
import { formatElapsed, msToRoundedMinutes } from "@/lib/format";
import { IconPlay, IconStop, IconWork } from "@/components/icons";

const t = strings.vykazy.timer;

/**
 * Stopky „začít / zastavit práci". Běžící měření žije v IndexedDB, takže
 * přežije přechod mezi stránkami i zavření aplikace. Po zastavení vznikne
 * běžný záznam práce.
 *
 * `idleHidden` = když neběží, nic nevykreslí (pro dashboard).
 */
export function TimerWidget({ idleHidden = false }: { idleHidden?: boolean }) {
  const timer = useLiveQuery(() => getDb().activeTimer.get("current").then((x) => x ?? null), []);
  const clients = useLiveQuery(() => getDb().clients.orderBy("name").toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.orderBy("name").toArray(), []);

  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);

  // Tik každou sekundu, jen když měření běží.
  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [timer?.startedAt, timer]);

  if (timer === undefined) return null; // načítá se
  if (!timer && idleHidden) return null; // na dashboardu neběžící stopky skryjeme

  const clientProjects = projects?.filter((p) => p.clientId === Number(clientId)) ?? [];

  async function start() {
    if (!clientId) return;
    setBusy(true);
    await getDb().activeTimer.put({
      id: "current",
      startedAt: Date.now(),
      clientId: Number(clientId),
      projectId: projectId ? Number(projectId) : null,
      description: description.trim() || undefined,
    });
    setBusy(false);
  }

  async function stop() {
    if (!timer) return;
    setBusy(true);
    const durationMinutes = msToRoundedMinutes(Date.now() - timer.startedAt);
    const entry: TimeEntry = {
      clientId: timer.clientId,
      projectId: timer.projectId ?? null,
      date: isoDateFromTs(timer.startedAt),
      durationMinutes,
      description: timer.description,
      billed: false,
      invoiceId: null,
    };
    await getDb().timeEntries.add(entry);
    await getDb().activeTimer.delete("current");
    setClientId("");
    setProjectId("");
    setDescription("");
    setBusy(false);
  }

  async function discard() {
    if (!window.confirm(t.discardConfirm)) return;
    await getDb().activeTimer.delete("current");
  }

  // --- Běžící stav ---
  if (timer) {
    const client = clients?.find((c) => c.id === timer.clientId);
    const project =
      timer.projectId != null ? projects?.find((p) => p.id === timer.projectId) : undefined;
    const context = [client?.name, project?.name, timer.description].filter(Boolean).join(" · ");

    return (
      <div className="timer-card running">
        <div className="timer-live">
          <span className="timer-pulse" aria-hidden="true" />
          <div>
            <div className="timer-elapsed tnum">{formatElapsed(now - timer.startedAt)}</div>
            <div className="timer-context">{context || t.running}</div>
          </div>
        </div>
        <div className="timer-actions">
          <button type="button" className="btn btn-primary" onClick={stop} disabled={busy}>
            <IconStop /> {t.stop}
          </button>
          <button type="button" className="btn btn-ghost" onClick={discard} disabled={busy}>
            {t.discard}
          </button>
        </div>
      </div>
    );
  }

  // --- Nečinný stav (spuštění) ---
  const noClients = clients && clients.length === 0;
  return (
    <div className="timer-card">
      <div className="timer-idle-head">
        <span className="timer-idle-icon">
          <IconWork size={18} />
        </span>
        <span className="timer-idle-title">{t.title}</span>
      </div>
      <div className="timer-idle-fields">
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setProjectId("");
          }}
          aria-label={strings.vykazy.fields.client}
        >
          <option value="">{strings.vykazy.fields.selectClient}</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={!clientId}
          aria-label={strings.vykazy.fields.project}
        >
          <option value="">{strings.vykazy.fields.noProject}</option>
          {clientProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          aria-label={strings.vykazy.fields.description}
        />
        <button type="button" className="btn btn-primary" onClick={start} disabled={!clientId || busy}>
          <IconPlay /> {t.start}
        </button>
      </div>
      {noClients && <p className="field-hint">{strings.projekty.noClients}</p>}
    </div>
  );
}
