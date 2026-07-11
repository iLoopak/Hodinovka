/**
 * Výpočty DPH. Ceny položek se zadávají BEZ DPH (základ), DPH se přičítá.
 * Faktura má příznak `withVat` (snímek toho, zda je dodavatel plátce) — jen
 * pak se DPH počítá a zobrazuje.
 */
import type { Invoice, InvoiceItem } from "@/lib/db";

/** Sazby DPH v ČR: základní 21 %, snížená 12 %, nulová 0 %. */
export const VAT_RATES = [21, 12, 0] as const;
export const DEFAULT_VAT_RATE = 21;

export function itemVatRate(it: InvoiceItem): number {
  return it.vatRate ?? 0;
}

/** Základ položky (množství × cena bez DPH). */
export function lineNet(it: InvoiceItem): number {
  return it.quantity * it.unitPrice;
}

export function invoiceNet(items: InvoiceItem[]): number {
  return items.reduce((sum, it) => sum + lineNet(it), 0);
}

export function invoiceVat(items: InvoiceItem[], withVat: boolean | undefined): number {
  if (!withVat) return 0;
  return items.reduce((sum, it) => sum + lineNet(it) * (itemVatRate(it) / 100), 0);
}

export function invoiceGross(items: InvoiceItem[], withVat: boolean | undefined): number {
  return invoiceNet(items) + invoiceVat(items, withVat);
}

/** Částka k úhradě: s DPH u plátce, jinak čistý součet základů. */
export function invoicePayable(invoice: Pick<Invoice, "items" | "withVat">): number {
  return invoiceGross(invoice.items, invoice.withVat);
}

export interface VatRecapLine {
  rate: number;
  base: number;
  vat: number;
  total: number;
}

/** Rekapitulace DPH po sazbách (sestupně podle sazby). */
export function vatRecap(items: InvoiceItem[]): VatRecapLine[] {
  const map = new Map<number, { base: number; vat: number }>();
  for (const it of items) {
    const rate = itemVatRate(it);
    const base = lineNet(it);
    const cur = map.get(rate) ?? { base: 0, vat: 0 };
    cur.base += base;
    cur.vat += base * (rate / 100);
    map.set(rate, cur);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, v]) => ({ rate, base: v.base, vat: v.vat, total: v.base + v.vat }));
}
