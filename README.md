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

**Stav:** Přidán **export do ISDOC** (český národní standard pro elektronickou
fakturaci, XML `.isdoc` — naimportuje ho ABRA, Pohoda, Money…); generovaný
soubor je ověřen proti oficiálnímu XSD. Dále **QR Platba** na PDF (standard
SPD) a **podpora DPH pro plátce** (sazby 21/12/0 %, rozpis a rekapitulace DPH;
ceny bez DPH). Hotové i Fáze 1–8: Klienti + ARES, Projekty, Výkazy práce (vč.
stopek), faktury z výkazů i ruční, firemní profil, PDF export + sdílení,
záloha/obnova dat. Zbývá jen volitelná Fáze 9 (Capacitor APK).

> ARES posílá `Access-Control-Allow-Origin: *`, takže se volá přímo
> z prohlížeče (`lib/ares.ts`) — žádný proxy/backend není potřeba a lookup
> funguje i v `next dev`. Ruční zadání klienta je vždy plně podporováno.
