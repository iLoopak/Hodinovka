import type { Client, Project, TimeEntry } from "@/lib/db";

export interface UnbilledSummary {
  minutes: number;
  value: number; // v CZK (odhad podle sazeb)
  entryCount: number;
}

/**
 * Spočítá nevyfakturovaný čas a jeho hodnotu z existujících dat.
 * Sazba se bere z hodinového projektu, jinak z výchozí sazby klienta.
 * Fixní projekty a záznamy bez dohledatelné sazby se do hodnoty nezapočítají
 * (počítají se ale do nevyfakturovaných minut).
 *
 * Dokud nejsou žádné výkazy práce, vrací nuly — žádná vymyšlená data.
 */
export function computeUnbilled(
  entries: TimeEntry[],
  projects: Project[],
  clients: Client[]
): UnbilledSummary {
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  let minutes = 0;
  let value = 0;
  let entryCount = 0;

  for (const e of entries) {
    if (e.billed) continue;
    entryCount += 1;
    minutes += e.durationMinutes;

    const project = e.projectId != null ? projectById.get(e.projectId) : undefined;
    const client = clientById.get(e.clientId);

    let rate: number | undefined;
    if (project && project.billingType === "hourly" && project.rate != null) {
      rate = project.rate;
    } else if (client?.defaultRate != null) {
      rate = client.defaultRate;
    }
    if (rate != null) {
      value += (e.durationMinutes / 60) * rate;
    }
  }

  return { minutes, value, entryCount };
}
