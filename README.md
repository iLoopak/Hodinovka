# Hodinovka

Lokální PWA pro **výkazy práce a fakturaci** pro OSVČ. Veškerá data zůstávají
v prohlížeči (IndexedDB) — žádný backend, žádné účty, žádná synchronizace.
UI je zatím **jen česky**.

## Stack

- **Next.js** (App Router, statický export `output: "export"`)
- **Dexie.js** (obálka nad IndexedDB)
- **PWA** — `manifest.json` + vlastní service worker (offline shell)
- **Geist** (lokální font přes `next/font`, offline-safe)
- později: `@react-pdf/renderer` (PDF faktury), Capacitor (APK)

## Vizuální systém

Design tokeny (barvy, rozestupy, rádiusy, stíny, typografie) žijí v
`app/globals.css` jako CSS proměnné; světlý i tmavý režim. Sdílené UI
komponenty v `components/` (PageHeader, SectionHeader, ListRow, Monogram,
StatusBadge, EmptyState, QuickAction, MetricCard, SearchField, AppNav, ikony).

## Vývoj

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # statický export do out/
```

> Service worker se registruje jen v produkčním buildu, aby nekomplikoval
> hot reload při vývoji.

## Struktura

```
app/            # App Router — sekce Klienti / Projekty / Výkazy / Faktury
components/     # BottomNav, EmptyState, registrace service workeru
lib/db.ts       # Dexie schéma + TypeScript modely
lib/strings.ts  # centrální české texty
public/         # manifest, service worker, ikony
docs/           # roadmap.md + faktura-pdf-layout.md
```

Postup vývoje po fázích viz [`docs/roadmap.md`](docs/roadmap.md).

**Stav:** Fáze 6 (Personalizace faktur) hotová — sekce **Nastavení**
s firemním profilem (dodavatel), ze kterého budou čerpat faktury: název,
adresa, IČO/DIČ, plátce DPH, číslo účtu/IBAN, platební podmínky a patička,
nahrání loga a podpisu (zmenšení přes canvas → Blob v IndexedDB), výběr
akcentové barvy a šablony (3 rozvržení) + živý náhled hlavičky faktury.
Hotové i Fáze 1–5: Klienti + ARES, Projekty, Výkazy práce (vč. stopek),
faktury z výkazů i ruční vystavení, vizuální systém. Vlastní render PDF
a odeslání e-mailem (Fáze 7) zatím čeká — náhled je zatím jen v Nastavení.

> ARES posílá `Access-Control-Allow-Origin: *`, takže se volá přímo
> z prohlížeče (`lib/ares.ts`) — žádný proxy/backend není potřeba a lookup
> funguje i v `next dev`. Ruční zadání klienta je vždy plně podporováno.
