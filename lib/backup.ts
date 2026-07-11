/**
 * Záloha a obnova celé databáze do jednoho JSON souboru.
 *
 * Data žijí jen v prohlížeči (IndexedDB) — žádná cloudová záloha neexistuje,
 * proto je ruční export/import jediná pojistka proti ztrátě. Bloby (logo,
 * podpis) se serializují jako data URL; cache PDF se nezálohuje (regeneruje se).
 */
import { getDb, type BusinessProfile } from "@/lib/db";

const BACKUP_APP = "hodinovka";
const BACKUP_VERSION = 1;

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupError";
  }
}

export interface BackupSummary {
  clients: number;
  projects: number;
  timeEntries: number;
  invoices: number;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

/** Serializovaný profil — Blob pole nahrazena `{ __blob: dataUrl }`. */
type BlobRef = { __blob: string };
type SerializedProfile = Omit<BusinessProfile, "logo" | "signature"> & {
  logo?: BlobRef;
  signature?: BlobRef;
};

/** Vytvoří JSON zálohu všech dat a vrátí ji jako soubor ke stažení. */
export async function exportBackup(): Promise<{ blob: Blob; fileName: string }> {
  const db = getDb();
  const [clients, projects, timeEntries, invoicesRaw, profilesRaw] = await Promise.all([
    db.clients.toArray(),
    db.projects.toArray(),
    db.timeEntries.toArray(),
    db.invoices.toArray(),
    db.businessProfile.toArray(),
  ]);

  // Cache PDF do zálohy nepatří (jde regenerovat a zbytečně by ji nafoukla).
  const invoices = invoicesRaw.map(({ pdfBlob, pdfSignature, ...rest }) => rest);

  const businessProfile: SerializedProfile[] = await Promise.all(
    profilesRaw.map(async (p) => ({
      ...p,
      logo: p.logo ? { __blob: await blobToDataUrl(p.logo) } : undefined,
      signature: p.signature ? { __blob: await blobToDataUrl(p.signature) } : undefined,
    }))
  );

  const payload = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { clients, projects, timeEntries, invoices, businessProfile },
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return { blob, fileName: `hodinovka-zaloha-${stamp}.json` };
}

/**
 * Obnoví data ze zálohy — VYMAŽE stávající data a nahradí je zálohou.
 * Vrací počty obnovených záznamů. Volající se musí ptát na potvrzení.
 */
export async function importBackup(file: File): Promise<BackupSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new BackupError("Soubor není platný JSON.");
  }

  const root = parsed as { app?: string; data?: Record<string, unknown> };
  if (!root || root.app !== BACKUP_APP || !root.data) {
    throw new BackupError("Tohle nevypadá jako záloha Hodinovky.");
  }

  const asArray = (v: unknown) => (Array.isArray(v) ? v : []);
  const clients = asArray(root.data.clients);
  const projects = asArray(root.data.projects);
  const timeEntries = asArray(root.data.timeEntries);
  const invoices = asArray(root.data.invoices);
  const profilesRaw = asArray(root.data.businessProfile) as SerializedProfile[];

  // Bloby zpět na Blob ještě před transakcí (v transakci už nesmí být cizí await).
  const businessProfile: BusinessProfile[] = await Promise.all(
    profilesRaw.map(async (p) => ({
      ...p,
      logo: p.logo?.__blob ? await dataUrlToBlob(p.logo.__blob) : undefined,
      signature: p.signature?.__blob ? await dataUrlToBlob(p.signature.__blob) : undefined,
    }))
  );

  const db = getDb();
  await db.transaction(
    "rw",
    [db.clients, db.projects, db.timeEntries, db.invoices, db.businessProfile, db.activeTimer],
    async () => {
      await Promise.all([
        db.clients.clear(),
        db.projects.clear(),
        db.timeEntries.clear(),
        db.invoices.clear(),
        db.businessProfile.clear(),
        db.activeTimer.clear(),
      ]);
      if (clients.length) await db.clients.bulkAdd(clients);
      if (projects.length) await db.projects.bulkAdd(projects);
      if (timeEntries.length) await db.timeEntries.bulkAdd(timeEntries);
      if (invoices.length) await db.invoices.bulkAdd(invoices);
      if (businessProfile.length) await db.businessProfile.bulkAdd(businessProfile);
    }
  );

  return {
    clients: clients.length,
    projects: projects.length,
    timeEntries: timeEntries.length,
    invoices: invoices.length,
  };
}
