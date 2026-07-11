/**
 * Sdílené utility pro adresy (dodavatel i klient mají strukturovanou adresu:
 * ulice / číslo / obec / PSČ).
 */

export interface StructuredAddress {
  street?: string;
  streetNumber?: string;
  city?: string;
  zip?: string;
}

/**
 * Rozdělí víceřádkovou adresu na strukturovaná pole (best-effort). Používá se
 * jen při migraci starého volného pole `address`.
 */
export function parseAddress(address: string | undefined | null): Required<StructuredAddress> {
  const out = { street: "", streetNumber: "", city: "", zip: "" };
  const lines = (address ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return out;

  const zipIdx = lines.findIndex((l) => /\d{3}\s?\d{2}/.test(l));
  if (zipIdx >= 0) {
    const zm = lines[zipIdx].match(/(\d{3})\s?(\d{2})/);
    out.zip = zm ? `${zm[1]} ${zm[2]}` : "";
    out.city = lines[zipIdx].replace(/\d{3}\s?\d{2}/, "").trim().replace(/^,\s*/, "");
    const streetLine = lines[zipIdx > 0 ? zipIdx - 1 : 0] ?? "";
    const bm = streetLine.match(/^(.*?)\s+(\d+[\d/a-zA-Z]*)\s*$/);
    if (bm) {
      out.street = bm[1].trim();
      out.streetNumber = bm[2].trim();
    } else {
      out.street = streetLine;
    }
  } else {
    out.street = lines.join(", ");
  }
  return out;
}

/** Řádky adresy pro zobrazení: „ulice číslo" a „PSČ obec". */
export function addressLines(a: StructuredAddress): string[] {
  const line1 = [a.street, a.streetNumber].filter(Boolean).join(" ");
  const line2 = [a.zip, a.city].filter(Boolean).join(" ");
  return [line1, line2].filter(Boolean);
}
