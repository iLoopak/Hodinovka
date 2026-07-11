# Fakturace & Time Tracking PWA — Development Roadmap

**Stack:** Next.js (static export) · Dexie.js (IndexedDB wrapper) · pdf-lib or @react-pdf/renderer · Web Share API · Capacitor (APK later) · Vercel (hosting + 1 Edge Function for ARES proxy)
**Locale:** Czech-only UI (no i18n abstraction needed — hardcode Czech strings, but keep them in a single `strings.ts` file so they're not scattered, in case English is ever wanted later)
**Data:** 100% local, IndexedDB only. No backend, no accounts, no sync.

---

## Phase 0 — Project Scaffolding

**Goal:** Empty but installable PWA with working local DB.

- [ ] Next.js app (App Router), configured for static export or Vercel edge deploy
- [ ] PWA manifest.json + service worker (installable, offline shell caching)
- [ ] Dexie.js schema defined (see Data Model below) with a DB version + migration stub
- [ ] Basic app shell: bottom nav or sidebar with 4 sections — **Klienti / Projekty / Výkazy práce / Faktury**
- [ ] `strings.ts` — central Czech copy file (even if only used in one place initially)

**Acceptance:** App installs on desktop/mobile, opens offline, empty state screens for all 4 sections.

---

## Phase 1 — Klienti (Client Management)

**Goal:** Add/edit/view clients, with ARES auto-fill by IČO.

- [ ] Vercel Edge Function: `/api/ares/[ico]` — proxies `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ICO}`, returns normalized JSON (name, address, DIČ, legal form). Handles 404 (IČO not found) and upstream errors gracefully.
- [ ] "Nový klient" form: IČO field with "Načíst z ARES" button → auto-fills name/address/DIČ, all fields remain editable after fill (in case ARES data is stale/wrong)
- [ ] Manual entry also fully supported (no IČO required — for foreign/individual clients)
- [ ] Client list view (searchable by name/IČO)
- [ ] Client detail view showing: contact info, linked projects, linked invoices, "Nová faktura" quick action
- [ ] Edit / delete client (delete should warn if projects/invoices exist)

**Data fields:** name, IČO, DIČ, address, email, phone (optional), default hourly rate, currency (default CZK), notes

**Acceptance:** Can create a client purely by typing an IČO and clicking one button; can also create one fully manually.

---

## Phase 2 — Projekty (Project Management)

**Goal:** Projects nested under a client, with billing type.

- [ ] "Nový projekt" form on client detail page: name, description, start date, end date (optional), billing type (hodinová sazba / fixní cena), rate or fixed price, notes
- [ ] Project list embedded in client detail (not a separate top-level nav item, per your spec — though a global "Projekty" search/filter view is still useful, so include a simple cross-client project list too)
- [ ] Project detail view: shows description, dates, billing info, notes, linked time entries, linked invoices, "Nová faktura" quick action
- [ ] Edit / delete project (delete should warn if time entries/invoices exist)
- [ ] Project status derived from dates (active / ended) shown as a badge

**Data fields:** clientId, name, description, startDate, endDate (nullable), billingType (hourly/fixed), rate, notes

**Acceptance:** Each client can have N projects; project detail clearly shows billing terms and notes.

---

## Phase 3 — Výkazy práce (Time Tracking)

**Goal:** Log time against a project (or directly against a client for ad-hoc work with no project).

- [ ] Manual time entry form: date, duration (hours/minutes input), description, linked project OR linked client directly
- [ ] Optional simple start/stop timer that writes a manual entry on stop (nice-to-have, not blocking)
- [ ] Time entries list: filterable by client, by project, by month
- [ ] Monthly summary view per client/project: total hours, total unbilled value (hours × rate)
- [ ] Mark entries as "billed" once included in an invoice (prevents double-billing)

**Data fields:** id, projectId (nullable), clientId, date, durationMinutes, description, billed (bool), invoiceId (nullable, set once billed)

**Acceptance:** Can log hours against a project or a client; can see "X hodin nevyfakturováno" per client/project.

---

## Phase 4 — Faktury: Generate from Time Entries

**Goal:** Turn a month of unbilled time entries into an invoice draft.

- [ ] "Vytvořit fakturu" flow from client or project detail: pick date range (defaults to previous calendar month) → pulls all unbilled time entries in range → aggregates into invoice line items (either one line per entry, or grouped/summed per project — offer both as a toggle)
- [ ] For fixed-price projects: instead of time aggregation, offer to add the fixed price directly as a line item
- [ ] Draft invoice editor: line items are editable (add/remove/adjust price) before finalizing — time-tracking data pre-fills but doesn't lock the invoice
- [ ] On finalizing: marks all included time entries as `billed` + linked to the invoice id

**Acceptance:** Selecting "last month" for a client with logged hours produces a correct draft invoice with itemized entries, editable before saving.

---

## Phase 5 — Faktury: Manual Creation

**Goal:** Create an invoice from scratch, independent of time tracking.

- [x] "Nová faktura" available from: global Faktury tab, client detail, project detail
- [x] If launched from client/project, pre-fills client info (and project reference if applicable)
- [x] If launched from global tab, requires picking a client first
- [x] Manual line items: description, quantity, unit price (supports both "hours × rate" and flat amounts)
- [x] Auto-numbering: configurable format (e.g. `2026-001`), auto-incremented, editable per invoice if user wants to override
- [x] Variabilní symbol: auto-suggested (e.g. same as invoice number digits), editable
- [x] Due date: configurable default (e.g. +14 days), editable per invoice
- [x] Invoice status: draft / vystavena / zaplacena (manually toggled; overdue shown as a visual nudge via the "Po splatnosti" badge — not automated payment tracking)

> Manual creation shares the Phase 4 invoice editor. The "generate from time
> entries" step is now an optional, collapsible helper ("Předvyplnit z výkazů
> práce"); the editor starts with an empty line item so a from-scratch invoice
> needs no time data at all.

**Data fields:** id, invoiceNumber, clientId, projectId (nullable), issueDate, dueDate, variabilniSymbol, items[] (description, qty, unitPrice), status, createdFromTimeEntries (bool)

**Acceptance:** A fully valid invoice can be created in under a minute without touching time tracking at all.

---

## Phase 6 — Personalizace faktur (Invoice Personalization)

**Goal:** One-time business profile setup that all invoices pull from.

- [x] Settings screen: "Můj profil / Firma" — name, address, IČO, DIČ, bank account, IBAN, default payment terms text, footer note (+ plátce DPH)
- [x] Logo upload: file input → downscale via canvas (cap ~600px wide) → store as Blob in Dexie → preview in settings
- [x] Optional signature/stamp image upload, same pattern
- [x] Accent color picker (hex) — used for invoice header/table styling
- [x] 2–3 template layout choices (logo top-left classic, logo top-right classic, minimal no-color-block) — stored as `templateId`; a live header preview shows accent/logo/template. The actual `@react-pdf/renderer` layout components land in Phase 7.

**Data model:** single `businessProfile` object (id: 'default') — one settings record in a Dexie table keyed by id.

> `/nastaveni` (5th nav item). Profile persists as `businessProfile` (id `"default"`); logo/signature stored as PNG Blobs after canvas downscale. Preview uses fixed paper colors so it reads the same in dark mode. Phase 7 will consume this profile when rendering the PDF.

**Acceptance:** Uploading a logo once makes it appear on every subsequently generated invoice PDF; changing accent color updates future PDFs.

---

## Phase 7 — Export & Sdílení (PDF Export + Email Attach)

**Goal:** Turn a finished invoice into a PDF and get it into an email in one tap.

- [x] "Stáhnout PDF" + "Sdílet / Odeslat e-mailem" on invoice detail — renders with `@react-pdf/renderer`, respecting Czech legal fields (dodavatel/odběratel IČO+DIČ, datum vystavení/DUZP/splatnosti, VS, forma úhrady, bankovní spojení + IBAN, "Dodavatel není plátcem DPH" pro neplátce). Three templates from the profile (`classic-left` / `classic-right` / `minimal`), accent-coloured header + table.
- [x] "Sdílet / Odeslat e-mailem": `navigator.canShare({ files })` + `navigator.share()` → native share sheet with the PDF attached.
- [x] Desktop fallback: download the PDF + open a `mailto:` draft (subject/body pre-filled), with the hint "PDF bylo staženo — přiložte ho prosím ručně".
- [x] Cache generated PDF blob on the invoice record (`pdfBlob` + `pdfSignature`); regenerates only when invoice/client/profile data changes.

**Acceptance:** On a phone (PWA or APK), tapping "Sdílet / Odeslat e-mailem" opens the share sheet with the PDF ready to attach. On desktop, the PDF downloads and a mailto draft opens.

> **Font:** Geist Sans (already the app font, OFL) is bundled as TTF in `/public/fonts` and registered with react-pdf — full Czech diacritics (the standard WinAnsi PDF fonts can't render č/ř/š/ž/ě/ů). The library + document load **dynamically** (not in the main bundle) and the fonts are cached by the service worker for offline export. **VAT:** ✅ now supported — invoice items carry a per-line DPH rate (21 / 12 / 0 %) and the invoice stores a `withVat` snapshot of the supplier's plátce status. Plátci get per-line DPH, a "Rekapitulace DPH" table by rate, and Celkem bez DPH / DPH celkem / Celkem k úhradě on the PDF and detail; neplátci keep the "Dodavatel není plátcem DPH" line. Prices are entered net (bez DPH).

---

## Phase 8 — Polish & Data Safety

- [x] Dashboard/home view: unbilled hours per client, upcoming due invoices, quick "Nová faktura" / "Nový záznam práce" actions (unbilled hero + per-client breakdown + attention list + quick actions)
- [x] JSON export/import of the entire database — "Data a zálohování" in Nastavení: **Zálohovat data** downloads `hodinovka-zaloha-YYYY-MM-DD.json`; **Obnovit ze zálohy** replaces everything (with confirm). Blobs (logo/podpis) serialized as data URLs; PDF cache excluded (regenerable).
- [x] Basic input validation (soft IČO 8-digit hint on client form; project end-date-before-start-date blocked with `min` + error; required name/client already enforced)
- [x] Empty states and error states in Czech throughout (audited across lists, detail, forms, backup errors)

---

## Phase 9 — Capacitor APK (optional, later)

- [ ] Wrap the existing PWA in Capacitor (same pattern as your gaming backlog app)
- [ ] Verify `navigator.share()` with files works via Capacitor's WebView (may need the Capacitor Share plugin instead of the raw Web API — worth testing early rather than assuming parity)
- [ ] Test logo/PDF blob handling on-device storage limits

---

## Data Model Summary (Dexie schema sketch)

```ts
db.version(1).stores({
  clients: '++id, name, ico',
  projects: '++id, clientId, name, startDate',
  timeEntries: '++id, clientId, projectId, date, billed, invoiceId',
  invoices: '++id, clientId, projectId, invoiceNumber, issueDate, status',
  businessProfile: 'id' // single record, id: 'default'
});
```

## Suggested Build Order Rationale

Phases 1→3 give you a usable time-tracking tool on their own (useful checkpoint to test with real data). Phase 4 is the "magic moment" feature (time → invoice). Phase 5 can actually be built in parallel with Phase 4 since manual invoice creation is a subset of the same invoice editor UI. Phase 6 and 7 are what make it feel like a *product* rather than a spreadsheet replacement — worth not rushing.
