"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProjectForm } from "@/components/ProjectForm";
import { strings } from "@/lib/strings";

function NovyProjekt() {
  const params = useSearchParams();
  const clientIdParam = params.get("clientId");
  const presetClientId = clientIdParam ? Number(clientIdParam) : undefined;
  // Když přicházíme od klienta, zpět míří na jeho detail; jinak na seznam projektů.
  const backHref = presetClientId
    ? `/klienti/detail/?id=${presetClientId}`
    : "/projekty";

  return (
    <>
      <Link href={backHref} className="link-back">
        ← {strings.common.back}
      </Link>
      <header className="page-header">
        <h1>{strings.projekty.newTitle}</h1>
      </header>
      <ProjectForm presetClientId={presetClientId} />
    </>
  );
}

export default function NovyProjektPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>}>
      <NovyProjekt />
    </Suspense>
  );
}
