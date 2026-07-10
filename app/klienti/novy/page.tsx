"use client";

import Link from "next/link";
import { ClientForm } from "@/components/ClientForm";
import { strings } from "@/lib/strings";

export default function NovyKlientPage() {
  return (
    <>
      <Link href="/klienti" className="link-back">
        ← {strings.klienti.title}
      </Link>
      <header className="page-header">
        <h1>{strings.klienti.newTitle}</h1>
      </header>
      <ClientForm />
    </>
  );
}
