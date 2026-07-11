import type { TimeEntry, Project, Client } from "@/lib/db";

/** Časová značka (ms) → místní ISO datum YYYY-MM-DD. */
export function isoDateFromTs(ts: number): string {
  const off = new Date(ts).getTimezoneOffset();
  return new Date(ts - off * 60000).toISOString().slice(0, 10);
}

/** Dnešní datum jako ISO YYYY-MM-DD v místním čase. */
export function todayIso(): string {
  return isoDateFromTs(Date.now());
}

/** Aktuální měsíc jako "YYYY-MM". */
export function currentMonth(): string {
  return todayIso().slice(0, 7);
}

/** Patří ISO datum do měsíce "YYYY-MM"? */
export function isInMonth(iso: string, month: string): boolean {
  return iso.slice(0, 7) === month;
}

/** Posun měsíce "YYYY-MM" o delta měsíců. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const monthNames = [
  "leden", "únor", "březen", "duben", "květen", "červen",
  "červenec", "srpen", "září", "říjen", "listopad", "prosinec",
];

/** "YYYY-MM" → "červenec 2026". */
export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return `${monthNames[m - 1]} ${y}`;
}

export interface DayGroup {
  date: string; // ISO
  entries: TimeEntry[];
  minutes: number;
}

/** Seskupí záznamy podle dne, seřazeno od nejnovějšího dne. */
export function groupByDay(entries: TimeEntry[]): DayGroup[] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, list]) => ({
      date,
      entries: list,
      minutes: list.reduce((sum, e) => sum + e.durationMinutes, 0),
    }));
}

/**
 * Hodnota jednoho záznamu (hodiny × sazba).
 * - hodinový projekt se sazbou → sazba projektu,
 * - hodinový projekt bez sazby / ad-hoc bez projektu → výchozí sazba klienta,
 * - fixní projekt → 0 (fakturuje se fixní cenou, ne po hodinách),
 * - bez dohledatelné sazby → 0.
 */
export function entryValue(
  entry: TimeEntry,
  project: Project | undefined,
  client: Client | undefined
): number {
  let rate: number | undefined;
  if (project) {
    if (project.billingType === "fixed") {
      rate = undefined; // fixní projekt se nepočítá hodinově
    } else {
      rate = project.rate ?? client?.defaultRate;
    }
  } else {
    rate = client?.defaultRate;
  }
  if (rate == null) return 0;
  return (entry.durationMinutes / 60) * rate;
}
