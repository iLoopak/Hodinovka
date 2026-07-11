import type { Invoice, InvoiceItem, TimeEntry, Project, Client } from "@/lib/db";

export type AggregationMode = "perEntry" | "perProject";

/** Součet položek (množství × jednotková cena). */
export function invoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
}

/**
 * Výchozí číslo faktury ve formátu `RRRR-NNN` (pořadí v rámci roku).
 * Placeholder — v budoucnu půjde formát nastavit v profilu (Fáze 6).
 */
export function defaultInvoiceNumber(existing: Invoice[], isoDate: string): string {
  const year = isoDate.slice(0, 4);
  const re = new RegExp(`^${year}-(\\d+)$`);
  let max = 0;
  for (const inv of existing) {
    const m = inv.invoiceNumber.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${year}-${String(max + 1).padStart(3, "0")}`;
}

/** Variabilní symbol = číslice z čísla faktury. */
export function invoiceNumberToVs(num: string): string {
  return num.replace(/\D/g, "");
}

function rateFor(project: Project | undefined, client: Client): number {
  if (project && project.billingType === "hourly") {
    return project.rate ?? client.defaultRate ?? 0;
  }
  return client.defaultRate ?? 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Sestaví položky faktury z nevyfakturovaných výkazů.
 * - Fixní projekt (scoped) → jedna položka s fixní cenou (ne po hodinách).
 * - „perEntry" → jedna položka na záznam, „perProject" → sečteno po projektech.
 */
export function buildInvoiceItems(opts: {
  entries: TimeEntry[];
  scopedProject?: Project;
  projects: Project[];
  client: Client;
  mode: AggregationMode;
  vatRate?: number; // přiřadí se všem položkám (jen u faktur s DPH)
}): InvoiceItem[] {
  const { entries, scopedProject, projects, client, mode, vatRate } = opts;

  if (scopedProject && scopedProject.billingType === "fixed") {
    return [
      {
        description: scopedProject.name,
        quantity: 1,
        unit: "ks",
        unitPrice: scopedProject.rate ?? 0,
        vatRate,
      },
    ];
  }

  const projectById = new Map(projects.map((p) => [p.id, p]));

  if (mode === "perEntry") {
    return entries.map((e) => {
      const p = e.projectId != null ? projectById.get(e.projectId) : undefined;
      const desc = e.description?.trim() || p?.name || "Práce";
      return {
        description: desc,
        quantity: round2(e.durationMinutes / 60),
        unit: "h",
        unitPrice: rateFor(p, client),
        vatRate,
      };
    });
  }

  // perProject: sečíst minuty podle projektu (null = bez projektu)
  const groups = new Map<string, { project?: Project; minutes: number }>();
  for (const e of entries) {
    const key = String(e.projectId ?? "none");
    const p = e.projectId != null ? projectById.get(e.projectId) : undefined;
    const g = groups.get(key) ?? { project: p, minutes: 0 };
    g.minutes += e.durationMinutes;
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({
    description: g.project?.name || "Práce bez projektu",
    quantity: round2(g.minutes / 60),
    unit: "h",
    unitPrice: rateFor(g.project, client),
    vatRate,
  }));
}
