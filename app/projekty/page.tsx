"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { billingSummary } from "@/lib/project";
import { projectBadge } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { StatusBadge } from "@/components/StatusBadge";
import { IconPlus, IconFolder } from "@/components/icons";

const s = strings.projekty;

export default function ProjektyPage() {
  const [query, setQuery] = useState("");

  const projects = useLiveQuery(() => getDb().projects.orderBy("name").toArray(), []);
  const clients = useLiveQuery(() => getDb().clients.toArray(), []);

  const clientName = (id: number) => clients?.find((c) => c.id === id)?.name ?? "";

  const q = query.trim().toLowerCase();
  const filtered =
    projects?.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || clientName(p.clientId).toLowerCase().includes(q)
    ) ?? [];

  const addButton = (
    <Link href="/projekty/novy" className="btn btn-primary">
      <IconPlus />
      {s.add}
    </Link>
  );

  return (
    <>
      <PageHeader title={s.title} action={addButton} />

      {projects === undefined ? (
        <p className="loading-text">{strings.common.loading}</p>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<IconFolder />}
          title={s.empty}
          description={s.emptyHint}
          actionLabel={s.add}
          actionHref="/projekty/novy"
        />
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} placeholder={s.search} />
          {filtered.length === 0 ? (
            <p className="muted">{s.noResults}</p>
          ) : (
            <div className="list">
              {filtered.map((p) => (
                <ListRow
                  key={p.id}
                  href={`/projekty/detail/?id=${p.id}`}
                  leading={
                    <span className="monogram" aria-hidden="true">
                      <IconFolder size={18} />
                    </span>
                  }
                  title={p.name}
                  subtitle={[clientName(p.clientId), billingSummary(p)].filter(Boolean).join(" · ")}
                  meta={<StatusBadge spec={projectBadge(p)} />}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
