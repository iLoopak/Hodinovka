/**
 * Vercel Edge Function — proxy na ARES (registr ekonomických subjektů).
 *
 * Proč proxy: ARES API neposílá CORS hlavičky, takže z prohlížeče se volat
 * přímo nedá. Tahle funkce žije mimo statický Next export (kořenová složka
 * /api, kterou Vercel nasazuje jako samostatnou funkci).
 *
 * Cesta: GET /api/ares/{ico}
 * Vrací normalizovaný JSON: { ico, name, address, dic?, legalForm? }
 *
 * Pozn.: Ve `next dev` tahle funkce neběží — ARES lookup funguje až na
 * nasazené verzi (nebo přes `vercel dev`). Formulář klienta proto vždy
 * umožňuje ruční zadání.
 */

export const config = { runtime: "edge" };

const ARES_BASE =
  "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=86400", // ARES data se mění zřídka
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  // IČO čteme z cesty (poslední segment), ať nezávisíme na injektování params.
  const url = new URL(req.url);
  const raw = decodeURIComponent(url.pathname.split("/").pop() ?? "");
  const ico = raw.replace(/\D/g, ""); // jen číslice

  if (!ico) {
    return json({ error: "Chybí IČO." }, 400);
  }
  if (ico.length !== 8) {
    return json({ error: "IČO musí mít 8 číslic." }, 400);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${ARES_BASE}/${ico}`, {
      headers: { accept: "application/json" },
    });
  } catch {
    return json({ error: "ARES je momentálně nedostupný." }, 502);
  }

  if (upstream.status === 404) {
    return json({ error: `Subjekt s IČO ${ico} nebyl nalezen.` }, 404);
  }
  if (!upstream.ok) {
    return json({ error: "ARES vrátil chybu." }, 502);
  }

  let data: AresRaw;
  try {
    data = (await upstream.json()) as AresRaw;
  } catch {
    return json({ error: "Neplatná odpověď z ARES." }, 502);
  }

  const normalized = {
    ico: data.ico ?? ico,
    name: data.obchodniJmeno ?? "",
    address: data.sidlo?.textovaAdresa ?? "",
    dic: data.dic ?? undefined,
    legalForm: data.pravniForma ?? undefined,
  };

  return json(normalized, 200);
}

interface AresRaw {
  ico?: string;
  obchodniJmeno?: string;
  dic?: string;
  pravniForma?: string;
  sidlo?: {
    textovaAdresa?: string;
  };
}
