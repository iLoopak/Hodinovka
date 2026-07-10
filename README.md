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

**Stav:** Fáze 3 (Výkazy práce) hotová — zápis odpracovaného času ke klientovi
nebo projektu, časová osa po dnech s filtry (klient/projekt/měsíc), měsíční
souhrn odpracováno/nevyfakturováno; provázáno s detailem klienta i projektu a
s dashboardem. Hotové i Fáze 1–2 (Klienti + ARES, Projekty) a vizuální systém.
Fakturace (Fáze 4+) zatím čeká — sekce mají čestné „připravujeme" stavy.

> ARES posílá `Access-Control-Allow-Origin: *`, takže se volá přímo
> z prohlížeče (`lib/ares.ts`) — žádný proxy/backend není potřeba a lookup
> funguje i v `next dev`. Ruční zadání klienta je vždy plně podporováno.
