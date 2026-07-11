/**
 * Firemní profil dodavatele — jediný záznam (id: "default"), ze kterého
 * čerpají všechny faktury. Fáze 6 (Personalizace faktur).
 *
 * Vše zůstává lokálně: loga i podpis se ukládají jako Blob přímo do Dexie.
 */
import { getDb, type BusinessProfile } from "@/lib/db";

export const PROFILE_ID = "default";

/** Výchozí akcentová barva = zelený akcent aplikace. */
export const DEFAULT_ACCENT = "#3f7457";

export type TemplateId = NonNullable<BusinessProfile["templateId"]>;

export const TEMPLATES: TemplateId[] = ["classic-left", "classic-right", "minimal"];

/** Uloží (upsert) profil pod pevným id "default". */
export async function saveProfile(profile: Omit<BusinessProfile, "id">): Promise<void> {
  await getDb().businessProfile.put({ ...profile, id: PROFILE_ID });
}

/**
 * Zmenší nahraný obrázek na rozumnou šířku (kvůli velikosti v IndexedDB
 * i v budoucím PDF) a vrátí ho jako PNG Blob — PNG zachová průhlednost loga.
 * Běží jen v prohlížeči (používá canvas).
 */
export async function downscaleImage(file: File, maxWidth = 600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxWidth / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D kontext není dostupný.");
    ctx.drawImage(bitmap, 0, 0, w, h);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Nepodařilo se zpracovat obrázek."))),
        "image/png"
      );
    });
  } finally {
    bitmap.close();
  }
}
