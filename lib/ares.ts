/**
 * Klientský helper pro volání ARES proxy (viz api/ares/[ico].ts).
 */

export interface AresResult {
  ico: string;
  name: string;
  address: string;
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

/**
 * Načte subjekt z ARES podle IČO. Vyhazuje `AresError` s českou hláškou,
 * kterou lze rovnou zobrazit uživateli (404 = nenalezeno, 502 = ARES nedostupný,
 * atd.). Volající by měl vždy nechat i ruční zadání.
 */
export async function fetchAresByIco(ico: string): Promise<AresResult> {
  const clean = ico.replace(/\D/g, "");
  if (clean.length !== 8) {
    throw new AresError("IČO musí mít 8 číslic.", 400);
  }

  let res: Response;
  try {
    res = await fetch(`/api/ares/${clean}`, {
      headers: { accept: "application/json" },
    });
  } catch {
    throw new AresError("Nepodařilo se spojit s ARES.", 0);
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // ponecháme body = null
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : null) ?? "Načtení z ARES selhalo.";
    throw new AresError(msg, res.status);
  }

  return body as AresResult;
}
