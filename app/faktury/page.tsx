"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatMoney, formatDate } from "@/lib/format";
import { todayIso } from "@/lib/time";
import { invoicePayable } from "@/lib/vat";
import { invoiceStatusView, invoiceBadge } from "@/lib/status";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { StatusBadge } from "@/components/StatusBadge";
import { IconPlus, IconInvoices } from "@/components/icons";

const s = strings.faktury;

export default function FakturyPage() {
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayIso()), []);

  const invoices = useLiveQuery(() => getDb().invoices.toArray(), []);
  const clients = useLiveQuery(() => getDb().clients.toArray(), []);

  const clientName = (id: number) => clients?.find((c) => c.id === id)?.name ?? "";

  const sorted = invoices
    ? [...invoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : a.issueDate > b.issueDate ? -1 : 0))
    : [];

  const addButton = (
    <Link href="/faktury/nova" className="btn btn-primary">
      <IconPlus />
      {s.add}
    </Link>
  );

  return (
    <>
      <PageHeader title={s.title} action={addButton} />

      {invoices === undefined || clients === undefined || !today ? (
        <p className="loading-text">{strings.common.loading}</p>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<IconInvoices />}
          title={s.empty}
          description={s.emptyHint}
          actionLabel={s.add}
          actionHref="/faktury/nova"
        />
      ) : (
        <div className="list">
          {sorted.map((inv) => (
            <ListRow
              key={inv.id}
              href={`/faktury/detail/?id=${inv.id}`}
              leading={
                <span className="monogram" aria-hidden="true">
                  <IconInvoices size={18} />
                </span>
              }
              title={<span className="tnum">{inv.invoiceNumber}</span>}
              subtitle={`${clientName(inv.clientId)} · splatnost ${formatDate(inv.dueDate)}`}
              meta={
                <span className="invoice-meta">
                  <span className="tnum invoice-amount">{formatMoney(invoicePayable(inv), clients.find((c) => c.id === inv.clientId)?.currency)}</span>
                  <StatusBadge spec={invoiceBadge(invoiceStatusView(inv, today))} />
                </span>
              }
              showChevron={false}
            />
          ))}
        </div>
      )}
    </>
  );
}
