"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowLeft } from "@/components/icons";
import { strings } from "@/lib/strings";

const s = strings.klienti;

function EditClient() {
  const params = useSearchParams();
  const id = Number(params.get("id"));

  const client = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().clients.get(id).then((c) => c ?? null) : null),
    [id]
  );

  if (client === undefined) {
    return <p className="loading-text">{strings.common.loading}</p>;
  }
  if (!client) {
    return (
      <>
        <Link href="/klienti" className="link-back">
          <IconArrowLeft /> {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  return (
    <>
      <Link href={`/klienti/detail/?id=${id}`} className="link-back">
        <IconArrowLeft /> {client.name}
      </Link>
      <PageHeader title={s.editTitle} />
      <ClientForm existing={client} />
    </>
  );
}

export default function UpravitKlientaPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <EditClient />
    </Suspense>
  );
}
