/**
 * ARES lookup — volá registr ekonomických subjektů přímo z prohlížeče.
 *
 * ARES posílá `Access-Control-Allow-Origin: *`, takže proxy není potřeba.
 * Díky tomu funguje doplnění z IČO stejně v `next dev`, na nasazené PWA
 * i v Capacitor APK — bez jakéhokoli backendu.
 */

const ARES_BASE =
  "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

export interface AresResult {
  ico: string;
  name: string;
  // Adresa rozdělená na jednotlivá pole.
  street: string; // ulice
  streetNumber: string; // číslo popisné/orientační, např. "778/3a"
  city: string; // obec
  zip: string; // PSČ, formátované "140 00"
  dic?: string;
  legalForm?: string;
}

export class AresError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AresError";
    this.status = status;
  }
}

interface AresSidlo {
  nazevUlice?: string;
  nazevObce?: string;
  nazevCastiObce?: string;
  cisloDomovni?: number;
  cisloOrientacni?: number;
  cisloOrientacniPismeno?: string;
  psc?: number;
  textovaAdresa?: string;
}

interface AresRaw {
  ico?: string;
  obchodniJmeno?: string;
  dic?: string;
  pravniForma?: string;
  sidlo?: AresSidlo;
}

/** PSČ z ARES je číslo (14000) → naformátujeme na "140 00". */
export function formatPsc(psc: number | string | undefined): string {
  if (psc == null) return "";
  const digits = String(psc).replace(/\D/g, "");
  if (digits.length !== 5) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

/** Sestaví "778/3a" z čísla domovního, orientačního a písmene. */
function buildStreetNumber(s: AresSidlo): string {
  if (s.cisloDomovni == null) return "";
  const orient =
    s.cisloOrientacni != null
      ? `/${s.cisloOrientacni}${s.cisloOrientacniPismeno ?? ""}`
      : "";
  return `${s.cisloDomovni}${orient}`;
}

function normalize(data: AresRaw, ico: string): AresResult {
  const s = data.sidlo ?? {};
  return {
    ico: data.ico ?? ico,
    name: data.obchodniJmeno ?? "",
    // U malých obcí ARES nemá ulici — pak necháme street prázdné a číslo
    // popisné je jediná adresní část.
    street: s.nazevUlice ?? "",
    streetNumber: buildStreetNumber(s),
    city: s.nazevObce ?? "",
    zip: formatPsc(s.psc),
    dic: data.dic ?? undefined,
    legalForm: data.pravniForma ?? undefined,
  };
}

/**
 * Načte subjekt z ARES podle IČO. Vyhazuje `AresError` s českou hláškou
 * připravenou k zobrazení uživateli (404 = nenalezeno, 502 = chyba ARES…).
 * Volající by měl vždy nechat i ruční zadání.
 */
export async function fetchAresByIco(ico: string): Promise<AresResult> {
  const clean = ico.replace(/\D/g, "");
  if (clean.length !== 8) {
    throw new AresError("IČO musí mít 8 číslic.", 400);
  }

  let res: Response;
  try {
    res = await fetch(`${ARES_BASE}/${clean}`, {
      headers: { accept: "application/json" },
    });
  } catch {
    throw new AresError("Nepodařilo se spojit s ARES.", 0);
  }

  if (res.status === 404) {
    throw new AresError(`Subjekt s IČO ${clean} nebyl nalezen.`, 404);
  }
  if (!res.ok) {
    throw new AresError("ARES vrátil chybu.", res.status);
  }

  let data: AresRaw;
  try {
    data = (await res.json()) as AresRaw;
  } catch {
    throw new AresError("Neplatná odpověď z ARES.", 502);
  }

  return normalize(data, clean);
}
