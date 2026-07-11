"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { startTimer } from "@/lib/timer";
import { IconPlay, IconWork } from "@/components/icons";

const t = strings.vykazy.timer;

/**
 * Spuštění stopek (na stránce Práce). Když už měření běží, nic nevykreslí —
 * běžící stav řídí globální lišta (GlobalTimerBar) viditelná na všech stránkách.
 */
export function TimerWidget() {
  const timer = useLiveQuery(() => getDb().activeTimer.get("current").then((x) => x ?? null), []);
  const clients = useLiveQuery(() => getDb().clients.orderBy("name").toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.orderBy("name").toArray(), []);

  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  if (timer === undefined) return null; // načítá se
  if (timer) return null; // běží → řídí globální lišta

  const clientProjects = projects?.filter((p) => p.clientId === Number(clientId)) ?? [];
  const noClients = clients && clients.length === 0;

  async function start() {
    if (!clientId) return;
    setBusy(true);
    await startTimer(Number(clientId), projectId ? Number(projectId) : null, description);
    setBusy(false);
  }

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
