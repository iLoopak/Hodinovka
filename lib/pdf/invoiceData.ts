/**
 * Převod záznamů z DB na plochou datovou strukturu pro PDF renderer.
 * Bez závislosti na @react-pdf/renderer, ať jde snadno testovat i cachovat.
 */
import type { Invoice, Client, BusinessProfile } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { DEFAULT_ACCENT, type TemplateId } from "@/lib/profile";
import {
  invoiceNet,
  invoiceVat,
  invoiceGross,
  vatRecap,
  itemVatRate,
  type VatRecapLine,
} from "@/lib/vat";

export interface PdfItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string; // DD.MM.YYYY
  taxableSupplyDate: string;
  dueDate: string;
  variableSymbol: string;

  supplier: {
    name: string;
    address: string; // víceřádkově
    ico: string;
    dic?: string;
    bankAccount?: string;
    iban?: string;
  };
  customer: {
    name: string;
    address: string;
    ico?: string;
    dic?: string;
  };

  items: PdfItem[];
  totalAmount: number; // částka k úhradě (s DPH u plátce, jinak základ)
  currency: string;
  // DPH
  withVat: boolean;
  net: number;
  vatAmount: number;
  gross: number;
  recap: VatRecapLine[];
  paymentTerms?: string;
  footerNote?: string;

  logoUrl?: string; // data URL
  signatureUrl?: string; // data URL
  accentColor: string;
  templateId: TemplateId;
}

/** Poskládá adresu klienta z jednotlivých polí do dvou řádků. */
function clientAddress(c?: Client | null): string {
  if (!c) return "";
  const line1 = [c.street, c.streetNumber].filter(Boolean).join(" ");
  const line2 = [c.zip, c.city].filter(Boolean).join(" ");
  return [line1, line2].filter(Boolean).join("\n");
}

export function buildInvoiceData(
  invoice: Invoice,
  client: Client | null | undefined,
  profile: BusinessProfile | null | undefined,
  images: { logoUrl?: string; signatureUrl?: string } = {}
): InvoiceData {
  const items: PdfItem[] = invoice.items.map((it) => ({
    description: it.description,
    quantity: it.quantity,
    unit: it.unit,
    unitPrice: it.unitPrice,
    vatRate: itemVatRate(it),
    total: it.quantity * it.unitPrice,
  }));

  const withVat = invoice.withVat ?? false;
  const net = invoiceNet(invoice.items);
  const vatAmount = invoiceVat(invoice.items, withVat);
  const gross = invoiceGross(invoice.items, withVat);

  return {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: formatDate(invoice.issueDate),
    taxableSupplyDate: formatDate(invoice.taxableSupplyDate),
    dueDate: formatDate(invoice.dueDate),
    variableSymbol: invoice.variabilniSymbol,

    supplier: {
      name: profile?.name ?? "",
      address: profile?.address ?? "",
      ico: profile?.ico ?? "",
      dic: profile?.dic,
      bankAccount: profile?.bankAccount,
      iban: profile?.iban,
    },
    customer: {
      name: client?.name ?? "",
      address: clientAddress(client),
      ico: client?.ico,
      dic: client?.dic,
    },

    items,
    totalAmount: withVat ? gross : net,
    currency: client?.currency ?? "CZK",
    withVat,
    net,
    vatAmount,
    gross,
    recap: withVat ? vatRecap(invoice.items) : [],
    paymentTerms: profile?.paymentTerms,
    footerNote: profile?.footerNote,

    logoUrl: images.logoUrl,
    signatureUrl: images.signatureUrl,
    accentColor: profile?.accentColor ?? DEFAULT_ACCENT,
    templateId: profile?.templateId ?? "classic-left",
  };
}

/**
 * Otisk vstupů faktury pro cache PDF. Když se otisk nezmění, znovu se
 * negeneruje. Obrázky zastupuje jejich velikost (levné, dostatečné).
 */
export function pdfSignature(
  invoice: Invoice,
  client: Client | null | undefined,
  profile: BusinessProfile | null | undefined
): string {
  return JSON.stringify({
    inv: {
      n: invoice.invoiceNumber,
      vs: invoice.variabilniSymbol,
      i: invoice.issueDate,
      d: invoice.dueDate,
      t: invoice.taxableSupplyDate ?? "",
      wv: invoice.withVat ?? false,
      items: invoice.items,
    },
    cl: client
      ? {
          n: client.name,
          ico: client.ico ?? "",
          dic: client.dic ?? "",
          st: client.street ?? "",
          sn: client.streetNumber ?? "",
          c: client.city ?? "",
          z: client.zip ?? "",
          cur: client.currency,
        }
      : null,
    pr: profile
      ? {
          n: profile.name ?? "",
          a: profile.address ?? "",
          ico: profile.ico ?? "",
          dic: profile.dic ?? "",
          ba: profile.bankAccount ?? "",
          ib: profile.iban ?? "",
          vat: profile.isVatPayer ?? false,
          pt: profile.paymentTerms ?? "",
          fn: profile.footerNote ?? "",
          ac: profile.accentColor ?? "",
          tpl: profile.templateId ?? "",
          logo: profile.logo?.size ?? 0,
          sig: profile.signature?.size ?? 0,
        }
      : null,
  });
}
