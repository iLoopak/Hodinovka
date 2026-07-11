# Hodinovka

Lokální PWA pro **výkazy práce a fakturaci** pro OSVČ. Veškerá data zůstávají
v prohlížeči (IndexedDB) — žádný backend, žádné účty, žádná synchronizace.
UI je zatím **jen česky**.

## Stack

- **Next.js** (App Router, statický export `output: "export"`)
- **Dexie.js** (obálka nad IndexedDB)
- **PWA** — `manifest.json` + vlastní service worker (offline shell)
- **Geist** (lokální font přes `next/font`, offline-safe; TTF verze v `public/fonts` slouží i pro PDF)
- **@react-pdf/renderer** (PDF faktury; načítá se dynamicky až při exportu)
- později: Capacitor (APK)

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

**Stav:** Fáze 7 (Export PDF + sdílení) hotová — z detailu faktury lze
vygenerovat **PDF daňového dokladu** (`@react-pdf/renderer`, 3 šablony
z profilu, akcentová barva, logo/podpis, plná česká diakritika přes lokální
font Geist) a buď ho **stáhnout**, nebo **Sdílet / Odeslat e-mailem** přes
systémový share sheet (`navigator.share` s přílohou); na desktopu fallback =
stažení PDF + předvyplněný `mailto:`. Vygenerované PDF se cachuje na faktuře
a regeneruje se jen při změně dat. Hotové i Fáze 1–6: Klienti + ARES,
Projekty, Výkazy práce (vč. stopek), faktury z výkazů i ruční, firemní profil
v Nastavení, vizuální systém. Zbývá Fáze 8 (leštění a záloha/obnova dat)
a volitelně Fáze 9 (Capacitor APK).

> ARES posílá `Access-Control-Allow-Origin: *`, takže se volá přímo
> z prohlížeče (`lib/ares.ts`) — žádný proxy/backend není potřeba a lookup
> funguje i v `next dev`. Ruční zadání klienta je vždy plně podporováno.
