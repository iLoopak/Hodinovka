"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { projectStatus, billingSummary } from "@/lib/project";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";

const s = strings.projekty;

export default function ProjektyPage() {
  const [query, setQuery] = useState("");

  const projects = useLiveQuery(() => getDb().projects.orderBy("name").toArray(), []);
  const clients = useLiveQuery(() => getDb().clients.toArray(), []);

  const clientName = (id: number) =>
    clients?.find((c) => c.id === id)?.name ?? "";

  const q = query.trim().toLowerCase();
  const filtered =
    projects?.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || clientName(p.clientId).toLowerCase().includes(q)
    ) ?? [];

  return (
    <>
      <header className="page-header with-action">
        <h1>{s.title}</h1>
        <Link href="/projekty/novy" className="btn-primary">
          {s.add}
        </Link>
      </header>

      {projects === undefined ? (
        <p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>
      ) : projects.length === 0 ? (
        <EmptyState
          emoji="📁"
          title={s.empty}
          hint={s.emptyHint}
          actionLabel={s.add}
          actionHref="/projekty/novy"
        />
      ) : (
        <>
          <input
            className="search-input"
            type="search"
            placeholder={s.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>{s.noResults}</p>
          ) : (
            <div className="card-list">
              {filtered.map((p) => (
                <Link key={p.id} href={`/projekty/detail/?id=${p.id}`} className="card">
                  <div className="card-title-row">
                    <span className="card-title">{p.name}</span>
                    <StatusBadge status={projectStatus(p)} />
                  </div>
                  <div className="card-sub">
                    {[clientName(p.clientId), billingSummary(p)].filter(Boolean).join(" · ")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
