"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { ClientForm } from "@/components/ClientForm";
import { strings } from "@/lib/strings";

const s = strings.klienti;

function EditClient() {
  const params = useSearchParams();
  const id = Number(params.get("id"));

  // undefined = načítá se, null = nenalezeno (Dexie.get vrací u chybějícího undefined).
  const client = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().clients.get(id).then((c) => c ?? null) : null),
    [id]
  );

  if (client === undefined) {
    return <p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>;
  }
  if (!client) {
    return (
      <>
        <Link href="/klienti" className="link-back">
          ← {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  return (
    <>
      <Link href={`/klienti/detail/?id=${id}`} className="link-back">
        ← {client.name}
      </Link>
      <header className="page-header">
        <h1>{s.editTitle}</h1>
      </header>
      <ClientForm existing={client} />
    </>
  );
}

export default function UpravitKlientaPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>}>
      <EditClient />
    </Suspense>
  );
}
