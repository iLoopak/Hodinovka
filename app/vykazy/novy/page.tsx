"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TimeEntryForm } from "@/components/TimeEntryForm";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowLeft } from "@/components/icons";
import { strings } from "@/lib/strings";

function NovyZaznam() {
  const params = useSearchParams();
  const clientId = params.get("clientId");
  const projectId = params.get("projectId");

  return (
    <>
      <Link href="/vykazy" className="link-back">
        <IconArrowLeft /> {strings.vykazy.title}
      </Link>
      <PageHeader title={strings.vykazy.newTitle} />
      <TimeEntryForm
        presetClientId={clientId ? Number(clientId) : undefined}
        presetProjectId={projectId ? Number(projectId) : undefined}
      />
    </>
  );
}

export default function NovyZaznamPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <NovyZaznam />
    </Suspense>
  );
}
