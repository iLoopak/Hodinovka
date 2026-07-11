"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatElapsed } from "@/lib/format";
import { stopTimer, discardTimer } from "@/lib/timer";
import { IconStop, IconTrash } from "@/components/icons";

const t = strings.vykazy.timer;

/**
 * Globální lišta běžících stopek — viditelná na všech stránkách, dokud
 * měření běží. Řídí zastavení/zahození; spuštění je na stránce Práce.
 */
export function GlobalTimerBar() {
  const timer = useLiveQuery(() => getDb().activeTimer.get("current").then((x) => x ?? null), []);
  const clients = useLiveQuery(() => getDb().clients.toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.toArray(), []);

  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const running = !!timer;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [running]);

  // Posuneme obsah stránky, aby lišta nepřekrývala hlavičku.
  useEffect(() => {
    const root = document.documentElement;
    if (running) root.setAttribute("data-timer", "running");
    else root.removeAttribute("data-timer");
    return () => root.removeAttribute("data-timer");
  }, [running]);

  if (!timer) return null;

  const client = clients?.find((c) => c.id === timer.clientId);
  const project = timer.projectId != null ? projects?.find((p) => p.id === timer.projectId) : undefined;
  const context = [client?.name, project?.name, timer.description].filter(Boolean).join(" · ");

  async function stop() {
    setBusy(true);
    await stopTimer(timer!);
    setBusy(false);
  }
  async function discard() {
    if (!window.confirm(t.discardConfirm)) return;
    await discardTimer();
  }

  return (
    <div className="global-timer" aria-label={t.running}>
      <Link href="/vykazy" className="gt-info">
        <span className="timer-pulse" aria-hidden="true" />
        {/* aria-hidden: tikající čas by jinak hlásil čtečka každou sekundu */}
        <span className="gt-time tnum" aria-hidden="true">
          {formatElapsed(now - timer.startedAt)}
        </span>
        <span className="gt-context">{context || t.running}</span>
      </Link>
      <div className="gt-actions">
        <button type="button" className="btn btn-primary" onClick={stop} disabled={busy}>
          <IconStop /> {t.stopShort}
        </button>
        <button
          type="button"
          className="icon-btn gt-discard"
          onClick={discard}
          disabled={busy}
          aria-label={t.discard}
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
}
