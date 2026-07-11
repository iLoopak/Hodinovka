/**
 * Vygenerování PDF faktury. @react-pdf/renderer i samotný dokument se načítají
 * dynamicky, aby velká knihovna nebyla v hlavním bundlu — stáhne se až při
 * prvním exportu (a service worker ji pak cachuje pro offline).
 */
import type { InvoiceData } from "./invoiceData";

let fontsRegistered = false;

export async function generateInvoicePdf(data: InvoiceData): Promise<Blob> {
  const [{ pdf, Font }, { InvoiceDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./InvoiceDocument"),
  ]);

  if (!fontsRegistered) {
    Font.register({
      family: "Geist",
      fonts: [
        { src: "/fonts/Geist-Regular.ttf", fontWeight: 400 },
        { src: "/fonts/Geist-Medium.ttf", fontWeight: 500 },
        { src: "/fonts/Geist-SemiBold.ttf", fontWeight: 600 },
        { src: "/fonts/Geist-Bold.ttf", fontWeight: 700 },
      ],
    });
    // Bez dělení slov — česká slova by se dělila nevhodně.
    Font.registerHyphenationCallback((word) => [word]);
    fontsRegistered = true;
  }

  return pdf(<InvoiceDocument data={data} />).toBlob();
}

/** Text (SPD řetězec) → PNG data URL s QR kódem. Knihovna se načte dynamicky. */
export async function generateQrDataUrl(text: string): Promise<string> {
  const mod = await import("qrcode");
  const QRCode = (mod as unknown as { default?: typeof mod }).default ?? mod;
  return QRCode.toDataURL(text, { margin: 1, width: 256, errorCorrectionLevel: "M" });
}

/** Blob (logo/podpis z IndexedDB) → data URL pro <Image src>. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
