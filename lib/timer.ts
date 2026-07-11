import { getDb, type ActiveTimer, type TimeEntry } from "@/lib/db";
import { isoDateFromTs } from "@/lib/time";
import { msToRoundedMinutes } from "@/lib/format";

/** Spustí stopky (jediný běžící záznam). */
export async function startTimer(
  clientId: number,
  projectId: number | null,
  description?: string
): Promise<void> {
  await getDb().activeTimer.put({
    id: "current",
    startedAt: Date.now(),
    clientId,
    projectId: projectId ?? null,
    description: description?.trim() || undefined,
  });
}

/**
 * Zastaví stopky a uloží běžný záznam práce (zaokrouhleno na minuty, min. 1),
 * datovaný podle času spuštění. Vrací id vytvořeného záznamu.
 */
export async function stopTimer(timer: ActiveTimer): Promise<number> {
  const durationMinutes = msToRoundedMinutes(Date.now() - timer.startedAt);
  const entry: TimeEntry = {
    clientId: timer.clientId,
    projectId: timer.projectId ?? null,
    date: isoDateFromTs(timer.startedAt),
    durationMinutes,
    description: timer.description,
    billed: false,
    invoiceId: null,
  };
  const db = getDb();
  const id = (await db.timeEntries.add(entry)) as number;
  await db.activeTimer.delete("current");
  return id;
}

/** Zahodí běžící stopky bez uložení záznamu. */
export async function discardTimer(): Promise<void> {
  await getDb().activeTimer.delete("current");
}
