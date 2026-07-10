/**
 * Sdílené formátovací funkce (české lokální formáty).
 */

/** ISO datum (YYYY-MM-DD) → "10.07.2026". Prázdné/neplatné → "". */
export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

const czk = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
});

/** Částka → "11 200 Kč" (výchozí CZK). Pro jiné měny přidá kód za číslo. */
export function formatMoney(amount: number, currency = "CZK"): string {
  if (currency === "CZK") return czk.format(amount);
  const n = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(amount);
  return `${n} ${currency}`;
}

/** Minuty → hodiny jako české číslo, např. 90 → "1,5". */
export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(hours);
}

/** Minuty → čitelná doba, např. 90 → "1 h 30 min", 45 → "45 min", 120 → "2 h". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

const dayFmt = new Intl.DateTimeFormat("cs-CZ", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** ISO datum → "pondělí 7. července" (bez roku, pro hlavičky dní). */
export function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return dayFmt.format(d);
}
