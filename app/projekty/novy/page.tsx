"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProjectForm } from "@/components/ProjectForm";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowLeft } from "@/components/icons";
import { strings } from "@/lib/strings";

function NovyProjekt() {
  const params = useSearchParams();
  const clientIdParam = params.get("clientId");
  const presetClientId = clientIdParam ? Number(clientIdParam) : undefined;
  const backHref = presetClientId ? `/klienti/detail/?id=${presetClientId}` : "/projekty";

  return (
    <>
      <Link href={backHref} className="link-back">
        <IconArrowLeft /> {strings.common.back}
      </Link>
      <PageHeader title={strings.projekty.newTitle} />
      <ProjectForm presetClientId={presetClientId} />
    </>
  );
}

export default function NovyProjektPage() {
  return (
    <Suspense fallback={<p className="loading-text">{strings.common.loading}</p>}>
      <NovyProjekt />
    </Suspense>
  );
}
