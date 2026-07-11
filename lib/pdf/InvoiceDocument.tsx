/**
 * PDF daňového dokladu (@react-pdf/renderer). Tři varianty hlavičky podle
 * `templateId`; zbytek layoutu je sdílený. Modul se importuje jen dynamicky
 * (z lib/pdf/generate.tsx), aby se @react-pdf/renderer nedostal do hlavního
 * bundlu.
 */
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/format";
import { strings } from "@/lib/strings";
import type { InvoiceData } from "./invoiceData";

const P = strings.faktury.pdf;

const INK = "#1a1c1a";
const MUTED = "#55564f";
const LINE = "#e2e2dc";
const ROW_LINE = "#ecece7";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Geist",
    fontSize: 9.5,
    color: INK,
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 44,
    lineHeight: 1.45,
  },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { height: 48 },
  logoSmall: { height: 32 },
  // Bez letterSpacing — v @react-pdf rozbíjí výpočet výšky řádku a číslo
  // faktury se pak překrývá s nadpisem FAKTURA.
  title: { fontSize: 24, fontWeight: 700, lineHeight: 1.15 },
  titleNum: { fontSize: 11, color: MUTED, marginTop: 3 },
  accentBar: { height: 3, marginTop: 14, borderRadius: 2 },
  thinLine: { height: 1, marginTop: 14, backgroundColor: LINE },

  parties: { flexDirection: "row", marginTop: 22 },
  party: { flex: 1, paddingRight: 20 },
  partyLabel: { fontSize: 8, fontWeight: 700, marginBottom: 4 },
  partyName: { fontSize: 11, fontWeight: 600 },
  muted: { color: MUTED },

  meta: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: LINE,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 10,
  },
  metaRow: { flexDirection: "row", marginBottom: 2 },
  metaLabel: { width: 130, color: MUTED },
  metaValue: { fontWeight: 500, flex: 1 },

  table: { marginTop: 22 },
  th: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3 },
  thText: { fontSize: 8.5, fontWeight: 700 },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: ROW_LINE,
  },
  colDesc: { flex: 1, paddingRight: 8 },
  colQty: { width: 70, textAlign: "right" },
  colPrice: { width: 74, textAlign: "right" },
  colVat: { width: 40, textAlign: "right" },
  colTotal: { width: 78, textAlign: "right" },

  totals: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalBox: {
    minWidth: 240,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 2,
  },
  totalLabel: { fontSize: 11, fontWeight: 600 },
  totalValue: { fontSize: 15, fontWeight: 700 },
  note: { marginTop: 14, color: MUTED },

  // Rekapitulace DPH
  recap: { marginTop: 16, marginLeft: "auto", width: 280 },
  recapHead: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  recapRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 6 },
  rcLabel: { fontSize: 8, fontWeight: 700, color: MUTED },
  rcRate: { width: 70 },
  rcBase: { flex: 1, textAlign: "right" },
  rcVat: { width: 90, textAlign: "right" },

  sumBox: { minWidth: 260 },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    color: MUTED,
  },

  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  qrBlock: { alignItems: "center", width: 78 },
  qr: { width: 78, height: 78 },
  qrLabel: { fontSize: 7, fontWeight: 700, color: MUTED, marginTop: 3, letterSpacing: 0.3 },
  noteBlock: { maxWidth: 260 },
  noteLabel: { fontSize: 8, fontWeight: 700, color: MUTED, marginBottom: 2 },
  signature: { height: 56 },
});

const qtyFmt = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

function Header({ data }: { data: InvoiceData }) {
  const minimal = data.templateId === "minimal";
  const accent = data.accentColor;

  const title = (
    <View key="title">
      <Text style={[styles.title, { color: minimal ? INK : accent }]}>{P.title}</Text>
      <Text style={styles.titleNum}>
        {P.numberPrefix} {data.invoiceNumber}
      </Text>
    </View>
  );
  const logo = (
    <View key="logo">
      {data.logoUrl ? (
        <Image src={data.logoUrl} style={minimal ? styles.logoSmall : styles.logo} />
      ) : null}
    </View>
  );

  const order = data.templateId === "classic-right" ? [title, logo] : [logo, title];

  return (
    <View>
      <View style={styles.headerRow}>{order}</View>
      {minimal ? (
        <View style={styles.thinLine} />
      ) : (
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
      )}
    </View>
  );
}

function Party({
  label,
  name,
  address,
  ico,
  dic,
  accent,
}: {
  label: string;
  name: string;
  address: string;
  ico?: string;
  dic?: string;
  accent: string;
}) {
  return (
    <View style={styles.party}>
      <Text style={[styles.partyLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.partyName}>{name || "—"}</Text>
      {address
        .split("\n")
        .filter(Boolean)
        .map((l, i) => (
          <Text key={i} style={styles.muted}>
            {l}
          </Text>
        ))}
      {ico ? (
        <Text style={styles.muted}>
          {P.ico}: {ico}
        </Text>
      ) : null}
      {dic ? (
        <Text style={styles.muted}>
          {P.dic}: {dic}
        </Text>
      ) : null}
    </View>
  );
}

function Meta({ data }: { data: InvoiceData }) {
  const rows: Array<[string, string | undefined]> = [
    [P.issueDate, data.issueDate],
    [P.taxableSupplyDate, data.taxableSupplyDate],
    [P.dueDate, data.dueDate],
    [P.vs, data.variableSymbol],
    [P.paymentMethod, P.paymentMethodValue],
    [P.bankAccount, data.supplier.bankAccount],
    [P.iban, data.supplier.iban],
  ];
  return (
    <View style={styles.meta}>
      {rows
        .filter(([, v]) => v)
        .map(([label, value], i) => (
          <View key={i} style={styles.metaRow}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
          </View>
        ))}
    </View>
  );
}

function ItemsTable({ data }: { data: InvoiceData }) {
  const minimal = data.templateId === "minimal";
  const accent = data.accentColor;
  const money = (n: number) => formatMoney(n, data.currency);

  const headStyle = minimal
    ? { borderBottomWidth: 2, borderBottomColor: accent }
    : { backgroundColor: accent };
  const headColor = minimal ? INK : "#ffffff";

  const withVat = data.withVat;

  return (
    <View style={styles.table}>
      <View style={[styles.th, headStyle]}>
        <Text style={[styles.thText, styles.colDesc, { color: headColor }]}>{P.itemDescription}</Text>
        <Text style={[styles.thText, styles.colQty, { color: headColor }]}>{P.itemQty}</Text>
        <Text style={[styles.thText, styles.colPrice, { color: headColor }]}>{P.itemUnitPrice}</Text>
        {withVat && (
          <Text style={[styles.thText, styles.colVat, { color: headColor }]}>{P.itemVat}</Text>
        )}
        <Text style={[styles.thText, styles.colTotal, { color: headColor }]}>{P.itemTotal}</Text>
      </View>
      {data.items.map((it, i) => (
        <View style={styles.tr} key={i} wrap={false}>
          <Text style={styles.colDesc}>{it.description || "—"}</Text>
          <Text style={styles.colQty}>
            {qtyFmt.format(it.quantity)} {it.unit}
          </Text>
          <Text style={styles.colPrice}>{money(it.unitPrice)}</Text>
          {withVat && <Text style={styles.colVat}>{it.vatRate} %</Text>}
          <Text style={styles.colTotal}>{money(it.total)}</Text>
        </View>
      ))}
    </View>
  );
}

function Totals({ data }: { data: InvoiceData }) {
  const accent = data.accentColor;
  const money = (n: number) => formatMoney(n, data.currency);

  if (!data.withVat) {
    return (
      <View>
        <View style={styles.totals}>
          <View style={[styles.totalBox, { borderTopColor: accent }]}>
            <Text style={styles.totalLabel}>{P.total}</Text>
            <Text style={[styles.totalValue, { color: accent }]}>{money(data.totalAmount)}</Text>
          </View>
        </View>
        <Text style={styles.note}>{P.notVatPayer}</Text>
        {data.paymentTerms ? <Text style={styles.note}>{data.paymentTerms}</Text> : null}
      </View>
    );
  }

  return (
    <View>
      {/* Rekapitulace DPH */}
      <View style={styles.recap}>
        <View style={styles.recapHead}>
          <Text style={[styles.rcLabel, styles.rcRate]}>{P.vatRate}</Text>
          <Text style={[styles.rcLabel, styles.rcBase]}>{P.vatBase}</Text>
          <Text style={[styles.rcLabel, styles.rcVat]}>{P.vatColAmount}</Text>
        </View>
        {data.recap.map((r) => (
          <View style={styles.recapRow} key={r.rate}>
            <Text style={styles.rcRate}>{r.rate} %</Text>
            <Text style={styles.rcBase}>{money(r.base)}</Text>
            <Text style={styles.rcVat}>{money(r.vat)}</Text>
          </View>
        ))}
      </View>

      {/* Souhrn */}
      <View style={styles.totals}>
        <View style={styles.sumBox}>
          <View style={styles.sumRow}>
            <Text>{P.totalNet}</Text>
            <Text>{money(data.net)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text>{P.vatTotal}</Text>
            <Text>{money(data.vatAmount)}</Text>
          </View>
          <View style={[styles.totalBox, { borderTopColor: accent }]}>
            <Text style={styles.totalLabel}>{P.total}</Text>
            <Text style={[styles.totalValue, { color: accent }]}>{money(data.gross)}</Text>
          </View>
        </View>
      </View>
      {data.paymentTerms ? <Text style={styles.note}>{data.paymentTerms}</Text> : null}
    </View>
  );
}

function Footer({ data }: { data: InvoiceData }) {
  if (!data.footerNote && !data.signatureUrl && !data.qrUrl) return null;
  return (
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        {data.qrUrl ? (
          <View style={styles.qrBlock}>
            <Image src={data.qrUrl} style={styles.qr} />
            <Text style={styles.qrLabel}>{P.qrPayment}</Text>
          </View>
        ) : null}
        {data.footerNote ? (
          <View style={styles.noteBlock}>
            <Text style={styles.noteLabel}>{P.note}</Text>
            <Text style={styles.muted}>{data.footerNote}</Text>
          </View>
        ) : null}
      </View>
      {data.signatureUrl ? <Image src={data.signatureUrl} style={styles.signature} /> : <View />}
    </View>
  );
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document title={`Faktura ${data.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <Header data={data} />
        <View style={styles.parties}>
          <Party
            label={P.supplier}
            name={data.supplier.name}
            address={data.supplier.address}
            ico={data.supplier.ico}
            dic={data.supplier.dic}
            accent={data.accentColor}
          />
          <Party
            label={P.customer}
            name={data.customer.name}
            address={data.customer.address}
            ico={data.customer.ico}
            dic={data.customer.dic}
            accent={data.accentColor}
          />
        </View>
        <Meta data={data} />
        <ItemsTable data={data} />
        <Totals data={data} />
        <Footer data={data} />
      </Page>
    </Document>
  );
}
