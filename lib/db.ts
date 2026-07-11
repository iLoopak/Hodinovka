import Dexie, { type EntityTable } from "dexie";
import { parseAddress } from "@/lib/address";

/**
 * Datový model aplikace — 100 % lokálně v IndexedDB (přes Dexie.js).
 * Žádný backend, žádné účty, žádná synchronizace.
 *
 * Schéma odpovídá roadmapě (viz docs/roadmap.md → Data Model Summary).
 * Verze schématu je záměrně oddělená, aby šlo v budoucnu přidávat migrace.
 */

export type BillingType = "hourly" | "fixed";
export type InvoiceStatus = "draft" | "vystavena" | "zaplacena";

export interface Client {
  id?: number;
  name: string;
  ico?: string;
  dic?: string;
  // Adresa rozdělená na jednotlivá pole (kvůli fakturám a ARES).
  street?: string; // ulice, např. "Budějovická"
  streetNumber?: string; // číslo popisné/orientační, např. "778/3a"
  city?: string; // obec, např. "Praha"
  zip?: string; // PSČ, např. "140 00"
  email?: string;
  phone?: string;
  defaultRate?: number;
  currency: string; // výchozí "CZK"
  notes?: string;
}

export interface Project {
  id?: number;
  clientId: number;
  name: string;
  description?: string;
  startDate?: string; // ISO datum (YYYY-MM-DD)
  endDate?: string | null;
  billingType: BillingType;
  rate?: number; // hodinová sazba nebo fixní cena podle billingType
  notes?: string;
}

export interface TimeEntry {
  id?: number;
  clientId: number;
  projectId?: number | null; // ad-hoc práce může být přímo na klienta
  date: string; // ISO datum (YYYY-MM-DD)
  durationMinutes: number;
  description?: string;
  billed: boolean;
  invoiceId?: number | null; // nastaví se při vyfakturování
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string; // "h" | "ks" | ...
  unitPrice: number; // cena za MJ bez DPH
  vatRate?: number; // sazba DPH v % (21 / 12 / 0); jen u faktur s DPH
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  clientId: number;
  projectId?: number | null;
  issueDate: string; // ISO datum
  taxableSupplyDate?: string; // DUZP
  dueDate: string;
  variabilniSymbol: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  createdFromTimeEntries: boolean;
  // Snímek toho, zda byl dodavatel při vystavení plátcem DPH. Řídí, jestli se
  // počítá a zobrazuje DPH (historické faktury si tak drží svůj režim).
  withVat?: boolean;
  // Cache vygenerovaného PDF — aby se při dalším otevření neregenerovalo,
  // dokud se nezmění data (porovnává se `pdfSignature`). Neindexováno.
  pdfBlob?: Blob;
  pdfSignature?: string;
}

/**
 * Firemní profil dodavatele — jediný záznam (id: "default"),
 * ze kterého čerpají všechny faktury (Fáze 6).
 */
export interface BusinessProfile {
  id: string; // vždy "default"
  name?: string;
  // Adresa dodavatele rozdělená na pole (kvůli fakturám a ISDOC exportu).
  street?: string;
  streetNumber?: string;
  city?: string;
  zip?: string;
  ico?: string;
  dic?: string;
  bankAccount?: string;
  iban?: string;
  paymentTerms?: string;
  footerNote?: string;
  accentColor?: string; // hex
  templateId?: "classic-left" | "classic-right" | "minimal";
  isVatPayer?: boolean;
  logo?: Blob;
  signature?: Blob;
}

/**
 * Běžící stopky — jediný záznam (id: "current"). Ukládá se do IndexedDB,
 * aby měření přežilo přechod mezi stránkami i zavření aplikace (PWA).
 */
export interface ActiveTimer {
  id: string; // vždy "current"
  startedAt: number; // Date.now() v ms
  clientId: number;
  projectId?: number | null;
  description?: string;
}

export class HodinovkaDB extends Dexie {
  clients!: EntityTable<Client, "id">;
  projects!: EntityTable<Project, "id">;
  timeEntries!: EntityTable<TimeEntry, "id">;
  invoices!: EntityTable<Invoice, "id">;
  businessProfile!: EntityTable<BusinessProfile, "id">;
  activeTimer!: EntityTable<ActiveTimer, "id">;

  constructor() {
    super("hodinovka");

    // Indexy: jen pole, podle kterých se vyhledává/filtruje. Ostatní pole
    // žijí v objektu bez indexu.
    this.version(1).stores({
      clients: "++id, name, ico",
      projects: "++id, clientId, name, startDate",
      timeEntries: "++id, clientId, projectId, date, billed, invoiceId",
      invoices: "++id, clientId, projectId, invoiceNumber, issueDate, status",
      businessProfile: "id", // jediný záznam, id: "default"
    });

    // v2: adresa klienta rozdělena na ulici/číslo/město/PSČ.
    // Indexy se nemění; migrace jen převede staré volné pole `address`
    // (dáme ho do `street`, aby se data neztratila) a odstraní ho.
    this.version(2)
      .stores({
        clients: "++id, name, ico",
        projects: "++id, clientId, name, startDate",
        timeEntries: "++id, clientId, projectId, date, billed, invoiceId",
        invoices: "++id, clientId, projectId, invoiceNumber, issueDate, status",
        businessProfile: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table("clients")
          .toCollection()
          .modify((c: Client & { address?: string }) => {
            if (c.address && !c.street) {
              c.street = c.address;
            }
            delete c.address;
          });
      });

    // v3: běžící stopky (jediný záznam). Ostatní tabulky beze změny.
    this.version(3).stores({
      activeTimer: "id",
    });

    // v4: adresa dodavatele rozdělena na ulici/číslo/obec/PSČ (kvůli ISDOC).
    // Indexy se nemění; migrace jen převede staré volné pole `address`.
    this.version(4)
      .stores({ businessProfile: "id" })
      .upgrade(async (tx) => {
        await tx
          .table("businessProfile")
          .toCollection()
          .modify((p: BusinessProfile & { address?: string }) => {
            if (p.address && !p.street) {
              const a = parseAddress(p.address);
              p.street = a.street;
              p.streetNumber = a.streetNumber;
              p.city = a.city;
              p.zip = a.zip;
            }
            delete p.address;
          });
      });
  }
}

// Jediná sdílená instance DB. Vytvoří se až v prohlížeči (IndexedDB neexistuje
// při statickém buildu / SSR).
let _db: HodinovkaDB | null = null;

export function getDb(): HodinovkaDB {
  if (typeof window === "undefined") {
    throw new Error("getDb() lze volat jen na klientovi (IndexedDB není na serveru).");
  }
  if (!_db) {
    _db = new HodinovkaDB();
  }
  return _db;
}
