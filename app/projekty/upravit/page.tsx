"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { ProjectForm } from "@/components/ProjectForm";
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
    return <p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>;
  }
  if (!project) {
    return (
      <>
        <Link href="/projekty" className="link-back">
          ← {s.title}
        </Link>
        <p>{s.notFound}</p>
      </>
    );
  }

  return (
    <>
      <Link href={`/projekty/detail/?id=${id}`} className="link-back">
        ← {project.name}
      </Link>
      <header className="page-header">
        <h1>{s.editTitle}</h1>
      </header>
      <ProjectForm existing={project} />
    </>
  );
}

export default function UpravitProjektPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>}>
      <EditProject />
    </Suspense>
  );
}
