/**
 * Nativní most (Capacitor) — Fáze 9 (Android APK).
 *
 * Ve webu/PWA běží aplikace beze změny přes Web Share API a stahování přes
 * `<a download>`. V nativním obalu (Capacitor WebView) tyto webové API nejsou
 * spolehlivé, takže sdílení a ukládání řešíme přes pluginy Filesystem + Share.
 *
 * Pluginy se importují dynamicky (jen v nativní větvi), aby se jejich kód
 * nedostal do webového PWA bundlu — stejný vzor jako dynamické načítání PDF.
 */
import { Capacitor } from "@capacitor/core";

/** Běžíme uvnitř nativního obalu (Android/iOS), ne v prohlížeči? */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Blob → base64 (bez "data:...;base64," prefixu) pro Filesystem plugin. */
async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

/**
 * Sdílí soubor přes systémový share sheet. Zapíše ho do cache (dočasné) a
 * předá jeho URI pluginu Share, aby vznikla příloha (např. do e-mailu).
 */
export async function nativeShareFile(
  blob: Blob,
  fileName: string,
  opts?: { title?: string; text?: string }
): Promise<void> {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const data = await blobToBase64(blob);
  await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
  await Share.share({ title: opts?.title, text: opts?.text, files: [uri] });
}

/**
 * Uloží soubor do Dokumentů zařízení (obdoba „stáhnout" na webu).
 * Vrací jméno souboru pro zobrazení uživateli.
 */
export async function nativeSaveFile(blob: Blob, fileName: string): Promise<string> {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const data = await blobToBase64(blob);
  await Filesystem.writeFile({ path: fileName, data, directory: Directory.Documents });
  return fileName;
}
