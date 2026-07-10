import type { Project } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export type ProjectStatus = "active" | "ended";

/**
 * Stav projektu odvozený z dat: pokud má vyplněné datum konce a to už
 * uplynulo, je "ukončený"; jinak "aktivní".
 */
export function projectStatus(project: Project): ProjectStatus {
  if (project.endDate) {
    const end = new Date(project.endDate + "T23:59:59");
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) {
      return "ended";
    }
  }
  return "active";
}

/** Lidský popis fakturace, např. "Hodinová sazba · 800 Kč/h" nebo "Fixní cena · 20 000 Kč". */
export function billingSummary(project: Project, currency = "CZK"): string {
  if (project.billingType === "fixed") {
    const price = project.rate != null ? ` · ${formatMoney(project.rate, currency)}` : "";
    return `Fixní cena${price}`;
  }
  const rate =
    project.rate != null ? ` · ${formatMoney(project.rate, currency)}/h` : "";
  return `Hodinová sazba${rate}`;
}
