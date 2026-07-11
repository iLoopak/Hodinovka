/**
 * Česká QR Platba (standard SPD — Short Payment Descriptor).
 *
 * Vytvoří textový řetězec, který se zakóduje do QR kódu; bankovní appka ho
 * načte a předvyplní platbu. Vše lokálně, žádná externí služba.
 * Viz https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
 */
import type { BusinessProfile } from "@/lib/db";

/** Zbytek po dělení 97 nad (dlouhým) číselným řetězcem. */
export function mod97(numeric: string): number {
  let rem = 0;
  for (let i = 0; i < numeric.length; i++) {
    rem = (rem * 10 + (numeric.charCodeAt(i) - 48)) % 97;
  }
  return rem;
}

/**
 * Převede české číslo účtu („[předčíslí-]číslo/kód banky") na IBAN.
 * Vrátí null, pokud formát nesedí.
 */
export function czAccountToIban(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(?:(\d{1,6})-)?(\d{1,10})\/(\d{4})$/);
  if (!m) return null;
  const prefix = (m[1] ?? "").padStart(6, "0");
  const account = m[2].padStart(10, "0");
  const bank = m[3];
  const bban = bank + prefix + account; // 4 + 6 + 10 = 20 číslic
  // Kontrolní číslice: BBAN + "CZ" + "00" (C=12, Z=35) → 98 − (mod 97).
  const check = String(98 - mod97(bban + "123500")).padStart(2, "0");
  return `CZ${check}${bban}`;
}

/** IBAN z profilu — přednostně vyplněný IBAN, jinak odvozený z čísla účtu. */
export function resolveIban(profile: BusinessProfile | null | undefined): string | null {
  const explicit = profile?.iban?.replace(/\s+/g, "").toUpperCase();
  if (explicit && /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(explicit)) return explicit;
  return czAccountToIban(profile?.bankAccount);
}

/** Zpráva pro příjemce — bez diakritiky a hvězdiček, velkými písmeny, max 60. */
export function spdMessage(invoiceNumber: string): string {
  return `Faktura ${invoiceNumber}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, " ")
    .toUpperCase()
    .slice(0, 60);
}

/** Sestaví SPD řetězec pro QR Platbu (velkými písmeny kvůli hustotě QR). */
export function buildSpd(opts: {
  iban: string;
  amount: number;
  currency: string;
  vs?: string;
  message?: string;
}): string {
  const parts = [
    "SPD*1.0",
    `ACC:${opts.iban}`,
    `AM:${opts.amount.toFixed(2)}`,
    `CC:${opts.currency}`,
  ];
  if (opts.vs) parts.push(`X-VS:${opts.vs}`);
  if (opts.message) parts.push(`MSG:${opts.message}`);
  return parts.join("*").toUpperCase();
}
