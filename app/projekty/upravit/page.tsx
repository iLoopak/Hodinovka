"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { ProjectForm } from "@/components/ProjectForm";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowLeft } from "@/components/icons";
import { strings } from "@/lib/strings";

const s = strings.projekty;

function EditProject() {
  const params = useSearchParams();
  const id = Number(params.get("id"));

  const project = useLiveQuery(
    () => (Number.isFinite(id) ? getDb().projects.get(id).then((p) => p ?? null) : null),
    [id]
  );

  if (project === undefined) {
    return <p className="loading-text">{strings.common.loading}</p>;
  }
  if (!project) {
    return (
      <>
        <Link href="/projekty" className="link-back">
          <IconArrowLeft /> {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  return (
    <>
      <Link href={`/projekty/detail/?id=${id}`} className="link-back">
        <IconArrowLeft /> {project.name}
      </Link>
      <PageHeader title={s.editTitle} />
      <ProjectForm existing={project} />
    </>
  );
}

export default function UpravitProjektPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <EditProject />
    </Suspense>
  );
}
