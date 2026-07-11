/**
 * Vygenerování PDF faktury. @react-pdf/renderer i samotný dokument se načítají
 * dynamicky, aby velká knihovna nebyla v hlavním bundlu — stáhne se až při
 * prvním exportu (a service worker ji pak cachuje pro offline).
 */
import type { InvoiceData, QrMatrix } from "./invoiceData";

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

/**
 * Text (SPD řetězec) → vektorový QR kód (SVG path). Používá čisté `create()`
 * z knihovny `qrcode` (bez canvasu/DOM), takže funguje v prohlížeči i v Node
 * a vykreslí se ostře jako vektor přímo v PDF. Knihovna se načítá dynamicky.
 */
export async function generateQrMatrix(text: string): Promise<QrMatrix> {
  const mod = await import("qrcode");
  const QRCode = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;

  let path = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (data[r * size + c]) path += `M${c} ${r}h1v1h-1z`;
    }
  }
  return { size, path };
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
