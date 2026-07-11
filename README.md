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

**Stav:** Fáze 5 (Ruční faktura) hotová — fakturu lze vystavit od nuly bez
výkazů: klient, ruční položky (množství × cena i paušál), automatické číslo,
variabilní symbol a splatnost (+14 dní), stavy koncept/vystavena/zaplacena.
Předvyplnění z nevyfakturovaných výkazů (Fáze 4) je teď volitelný pomocník
v editoru faktury (rozbalí se automaticky při vystavení z detailu
klienta/projektu). Hotové i Fáze 1–3 (Klienti + ARES, Projekty, Výkazy práce
vč. stopek) a vizuální systém. Export do PDF a odeslání e-mailem (Fáze 7) zatím
čeká.

> ARES posílá `Access-Control-Allow-Origin: *`, takže se volá přímo
> z prohlížeče (`lib/ares.ts`) — žádný proxy/backend není potřeba a lookup
> funguje i v `next dev`. Ruční zadání klienta je vždy plně podporováno.
