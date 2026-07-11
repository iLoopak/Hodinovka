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

/** CSS proměnné akcentu, které aplikace používá napříč UI. */
export const ACCENT_VARS = [
  "--accent",
  "--accent-hover",
  "--accent-active",
  "--accent-soft",
  "--accent-contrast",
] as const;

/**
 * Zvolí kontrastní barvu textu (bílá / tmavá) podle jasu akcentu — aby byl
 * text na tlačítku čitelný i pro světlé akcenty.
 */
export function accentContrast(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#10231a" : "#ffffff";
}

/**
 * Odvodí odstíny akcentu z jediné barvy. Hover/active míchá směrem k textu
 * a soft k povrchu — díky tomu odstíny fungují ve světlém i tmavém režimu
 * (proměnné `--text` / `--surface` se samy přizpůsobí).
 */
export function accentTokens(hex: string): Record<string, string> {
  return {
    "--accent": hex,
    "--accent-hover": `color-mix(in srgb, ${hex} 82%, var(--text))`,
    "--accent-active": `color-mix(in srgb, ${hex} 68%, var(--text))`,
    "--accent-soft": `color-mix(in srgb, ${hex} 15%, var(--surface))`,
    "--accent-contrast": accentContrast(hex),
  };
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
