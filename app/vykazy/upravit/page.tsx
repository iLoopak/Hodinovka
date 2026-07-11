"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { TimeEntryForm } from "@/components/TimeEntryForm";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowLeft, IconTrash } from "@/components/icons";
import { strings } from "@/lib/strings";

const s = strings.vykazy;

function EditZaznam() {
  const router = useRouter();
  const params = useSearchParams();
  const id = Number(params.get("id"));

  const entry = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().timeEntries.get(id).then((e) => e ?? null) : null),
    [id]
  );

  if (entry === undefined) {
    return <p className="loading-text">{strings.common.loading}</p>;
  }
  if (!entry) {
    return (
      <>
        <Link href="/vykazy" className="link-back">
          <IconArrowLeft /> {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  async function handleDelete() {
    const message = entry!.billed ? `${s.deleteBilledWarn}\n\n${s.deleteConfirm}` : s.deleteConfirm;
    if (!window.confirm(message)) return;
    await getDb().timeEntries.delete(id);
    router.replace("/vykazy");
  }

  return (
    <>
      <Link href="/vykazy" className="link-back">
        <IconArrowLeft /> {s.title}
      </Link>
      <PageHeader title={s.editTitle} />
      <TimeEntryForm existing={entry} />
      <div className="danger-zone">
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          <IconTrash /> {strings.common.delete}
        </button>
      </div>
    </>
  );
}

export default function UpravitZaznamPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <EditZaznam />
    </Suspense>
  );
}
