"use client";

import Link from "next/link";
import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/PageHeader";
import { IconArrowLeft } from "@/components/icons";
import { strings } from "@/lib/strings";

export default function NovyKlientPage() {
  return (
    <>
      <Link href="/klienti" className="link-back">
        <IconArrowLeft /> {strings.klienti.title}
      </Link>
      <PageHeader title={strings.klienti.newTitle} />
      <ClientForm />
    </>
  );
}
