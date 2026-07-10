"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { Monogram } from "@/components/Monogram";
import { IconPlus, IconClients } from "@/components/icons";

const s = strings.klienti;

export default function KlientiPage() {
  const [query, setQuery] = useState("");

  const clients = useLiveQuery(() => getDb().clients.orderBy("name").toArray(), []);
  const projects = useLiveQuery(() => getDb().projects.toArray(), []);

  const projectCount = (clientId?: number) =>
    projects?.filter((p) => p.clientId === clientId).length ?? 0;

  const q = query.trim().toLowerCase();
  const filtered =
    clients?.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (c.ico ?? "").includes(q)
    ) ?? [];

  const addButton = (
    <Link href="/klienti/novy" className="btn btn-primary">
      <IconPlus />
      {s.add}
    </Link>
  );

  return (
    <>
      <PageHeader title={s.title} action={addButton} />

      {clients === undefined ? (
        <p className="loading-text">{strings.common.loading}</p>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<IconClients />}
          title={s.empty}
          description={s.emptyHint}
          actionLabel={s.add}
          actionHref="/klienti/novy"
        />
      ) : (
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={s.search}
          />
          {filtered.length === 0 ? (
            <p className="muted">{s.noResults}</p>
          ) : (
            <div className="list">
              {filtered.map((c) => {
                const count = projectCount(c.id);
                return (
                  <ListRow
                    key={c.id}
                    href={`/klienti/detail/?id=${c.id}`}
                    leading={<Monogram name={c.name} />}
                    title={c.name}
                    subtitle={
                      count > 0
                        ? `${count} ${pluralProjects(count)}`
                        : c.email || (c.ico ? `IČO ${c.ico}` : strings.klienti.noProjects)
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

function pluralProjects(n: number): string {
  if (n === 1) return "projekt";
  if (n >= 2 && n <= 4) return "projekty";
  return "projektů";
}
