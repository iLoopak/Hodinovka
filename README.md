# Hodinovka

Lokální PWA pro **výkazy práce a fakturaci** pro OSVČ. Veškerá data zůstávají
v prohlížeči (IndexedDB) — žádný backend, žádné účty, žádná synchronizace.
UI je zatím **jen česky**.

## Stack

- **Next.js** (App Router, statický export `output: "export"`)
- **Dexie.js** (obálka nad IndexedDB)
- **PWA** — `manifest.json` + vlastní service worker (offline shell)
- později: `@react-pdf/renderer` (PDF faktury), Capacitor (APK)

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

**Stav:** Fáze 0 (scaffolding) hotová — instalovatelná PWA s prázdnými
sekcemi a funkčním lokálním DB schématem.
