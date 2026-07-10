"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { EmptyState } from "@/components/EmptyState";

const s = strings.klienti;

export default function KlientiPage() {
  const [query, setQuery] = useState("");

  const clients = useLiveQuery(
    () => getDb().clients.orderBy("name").toArray(),
    []
  );

  const q = query.trim().toLowerCase();
  const filtered =
    clients?.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.ico ?? "").includes(q)
    ) ?? [];

  return (
    <>
      <header className="page-header with-action">
        <h1>{s.title}</h1>
        <Link href="/klienti/novy" className="btn-primary">
          {s.add}
        </Link>
      </header>

      {clients === undefined ? (
        <p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>
      ) : clients.length === 0 ? (
        <EmptyState
          emoji="👥"
          title={s.empty}
          hint={s.emptyHint}
          actionLabel={s.add}
          actionHref="/klienti/novy"
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
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/klienti/detail/?id=${c.id}`}
                  className="card"
                >
                  <div className="card-title">{c.name}</div>
                  <div className="card-sub">
                    {[c.ico ? `IČO ${c.ico}` : null, c.email]
                      .filter(Boolean)
                      .join(" · ") || "—"}
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
