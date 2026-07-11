/**
 * Export faktury do formátu ISDOC 6.0.1 — český národní standard pro
 * elektronickou fakturaci (XML). Soubor `.isdoc` umí naimportovat běžné
 * účetní programy (ABRA, Pohoda, Money…).
 *
 * Struktura a povinné prvky vycházejí z oficiálního XSD
 * (http://isdoc.cz/namespace/2013, verze 6.0.1).
 *
 * Ceny se zadávají bez DPH; ISDOC nese základ i částku s DPH.
 */
import type { Invoice, Client, BusinessProfile } from "@/lib/db";
import { invoiceNet, invoiceVat, invoiceGross, vatRecap, lineNet, itemVatRate } from "@/lib/vat";
import { resolveIban } from "@/lib/payment";

const NS = "http://isdoc.cz/namespace/2013";
const VERSION = "6.0.1";

/** XML escape textového obsahu i atributů. */
function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Číslo pro XML (desetinná tečka, zaokrouhleno na haléře). */
function num(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Deterministický UUID (formát 8-4-4-4-12) z čísla faktury — stabilní při re-exportu. */
function uuidFromString(s: string): string {
  const hex: string[] = [];
  let h = 0x811c9dc5;
  for (let round = 0; round < 4; round++) {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= round * 0x9e3779b1;
    h = Math.imul(h, 0x01000193);
    hex.push((h >>> 0).toString(16).padStart(8, "0"));
  }
  const x = hex.join("");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`.toUpperCase();
}

interface Addr {
  street: string;
  building: string;
  city: string;
  zip: string;
}

function partyXml(
  role: "AccountingSupplierParty" | "AccountingCustomerParty",
  p: { name: string; ico: string; dic?: string; addr: Addr; email?: string; phone?: string }
): string {
  const taxScheme = p.dic
    ? `
      <PartyTaxScheme>
        <CompanyID>${esc(p.dic)}</CompanyID>
        <TaxScheme>VAT</TaxScheme>
      </PartyTaxScheme>`
    : "";
  const contact =
    p.email || p.phone
      ? `
      <Contact>
        <Telephone>${esc(p.phone ?? "")}</Telephone>
        <ElectronicMail>${esc(p.email ?? "")}</ElectronicMail>
      </Contact>`
      : "";
  return `  <${role}>
    <Party>
      <PartyIdentification>
        <ID>${esc(p.ico)}</ID>
      </PartyIdentification>
      <PartyName>
        <Name>${esc(p.name)}</Name>
      </PartyName>
      <PostalAddress>
        <StreetName>${esc(p.addr.street)}</StreetName>
        <BuildingNumber>${esc(p.addr.building)}</BuildingNumber>
        <CityName>${esc(p.addr.city)}</CityName>
        <PostalZone>${esc(p.addr.zip)}</PostalZone>
        <Country>
          <IdentificationCode>CZ</IdentificationCode>
          <Name>Česká republika</Name>
        </Country>
      </PostalAddress>${taxScheme}${contact}
    </Party>
  </${role}>`;
}

/** Sestaví ISDOC 6.0.1 XML z faktury, klienta a firemního profilu. */
export function buildIsdoc(
  invoice: Invoice,
  client: Client | null | undefined,
  profile: BusinessProfile | null | undefined
): string {
  const withVat = invoice.withVat ?? false;
  const currency = client?.currency ?? "CZK";
  const net = invoiceNet(invoice.items);
  const vat = invoiceVat(invoice.items, withVat);
  const gross = invoiceGross(invoice.items, withVat);

  // Řádky
  const lines = invoice.items
    .map((it, i) => {
      const rate = withVat ? itemVatRate(it) : 0;
      const base = lineNet(it);
      const tax = base * (rate / 100);
      const priceIncl = it.unitPrice * (1 + rate / 100);
      return `    <InvoiceLine>
      <ID>${i + 1}</ID>
      <InvoicedQuantity unitCode="${esc(it.unit)}">${num(it.quantity)}</InvoicedQuantity>
      <LineExtensionAmount>${num(base)}</LineExtensionAmount>
      <LineExtensionAmountTaxInclusive>${num(base + tax)}</LineExtensionAmountTaxInclusive>
      <LineExtensionTaxAmount>${num(tax)}</LineExtensionTaxAmount>
      <UnitPrice>${num(it.unitPrice)}</UnitPrice>
      <UnitPriceTaxInclusive>${num(priceIncl)}</UnitPriceTaxInclusive>
      <ClassifiedTaxCategory>
        <Percent>${num(rate)}</Percent>
        <VATCalculationMethod>0</VATCalculationMethod>
        <VATApplicable>${withVat ? "true" : "false"}</VATApplicable>
      </ClassifiedTaxCategory>
      <Item>
        <Description>${esc(it.description || "Položka")}</Description>
      </Item>
    </InvoiceLine>`;
    })
    .join("\n");

  // Rekapitulace DPH → TaxSubTotal po sazbách
  const recap = withVat
    ? vatRecap(invoice.items)
    : [{ rate: 0, base: net, vat: 0, total: net }];
  const subTotals = recap
    .map(
      (r) => `    <TaxSubTotal>
      <TaxableAmount>${num(r.base)}</TaxableAmount>
      <TaxAmount>${num(r.vat)}</TaxAmount>
      <TaxInclusiveAmount>${num(r.total)}</TaxInclusiveAmount>
      <AlreadyClaimedTaxableAmount>0</AlreadyClaimedTaxableAmount>
      <AlreadyClaimedTaxAmount>0</AlreadyClaimedTaxAmount>
      <AlreadyClaimedTaxInclusiveAmount>0</AlreadyClaimedTaxInclusiveAmount>
      <DifferenceTaxableAmount>${num(r.base)}</DifferenceTaxableAmount>
      <DifferenceTaxAmount>${num(r.vat)}</DifferenceTaxAmount>
      <DifferenceTaxInclusiveAmount>${num(r.total)}</DifferenceTaxInclusiveAmount>
      <TaxCategory>
        <Percent>${num(r.rate)}</Percent>
        <VATApplicable>${withVat ? "true" : "false"}</VATApplicable>
        <LocalReverseChargeFlag>false</LocalReverseChargeFlag>
      </TaxCategory>
    </TaxSubTotal>`
    )
    .join("\n");

  // Platební údaje
  const iban = resolveIban(profile) ?? "";
  const acc = (profile?.bankAccount ?? "").trim();
  const accMatch = acc.match(/^(.+)\/(\d{4})$/);
  const accId = accMatch ? accMatch[1] : acc;
  const bankCode = accMatch ? accMatch[2] : "";
  const paymentMeans =
    acc || iban
      ? `
  <PaymentMeans>
    <Payment>
      <PaidAmount>${num(gross)}</PaidAmount>
      <PaymentMeansCode>42</PaymentMeansCode>
      <Details>
        <PaymentDueDate>${esc(invoice.dueDate)}</PaymentDueDate>
        <ID>${esc(accId)}</ID>
        <BankCode>${esc(bankCode)}</BankCode>
        <Name></Name>
        <IBAN>${esc(iban)}</IBAN>
        <BIC></BIC>
        <VariableSymbol>${esc(invoice.variabilniSymbol)}</VariableSymbol>
        <ConstantSymbol></ConstantSymbol>
        <SpecificSymbol></SpecificSymbol>
      </Details>
    </Payment>
  </PaymentMeans>`
      : "";

  const supplier = partyXml("AccountingSupplierParty", {
    name: profile?.name ?? "",
    ico: profile?.ico ?? "",
    dic: withVat ? profile?.dic : undefined,
    addr: {
      street: profile?.street ?? "",
      building: profile?.streetNumber ?? "",
      city: profile?.city ?? "",
      zip: (profile?.zip ?? "").replace(/\s/g, ""),
    },
    email: undefined,
    phone: undefined,
  });
  const customer = partyXml("AccountingCustomerParty", {
    name: client?.name ?? "",
    ico: client?.ico ?? "",
    dic: client?.dic,
    addr: {
      street: client?.street ?? "",
      building: client?.streetNumber ?? "",
      city: client?.city ?? "",
      zip: (client?.zip ?? "").replace(/\s/g, ""),
    },
    email: client?.email,
    phone: client?.phone,
  });

  const taxPoint = invoice.taxableSupplyDate || invoice.issueDate;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${NS}" version="${VERSION}">
  <DocumentType>1</DocumentType>
  <ID>${esc(invoice.invoiceNumber)}</ID>
  <UUID>${uuidFromString(invoice.invoiceNumber)}</UUID>
  <IssuingSystem>Hodinovka</IssuingSystem>
  <IssueDate>${esc(invoice.issueDate)}</IssueDate>
  <TaxPointDate>${esc(taxPoint)}</TaxPointDate>
  <VATApplicable>${withVat ? "true" : "false"}</VATApplicable>
  <ElectronicPossibilityAgreementReference></ElectronicPossibilityAgreementReference>
  <LocalCurrencyCode>${esc(currency)}</LocalCurrencyCode>
  <CurrRate>1</CurrRate>
  <RefCurrRate>1</RefCurrRate>
${supplier}
${customer}
  <InvoiceLines>
${lines}
  </InvoiceLines>
  <TaxTotal>
${subTotals}
    <TaxAmount>${num(vat)}</TaxAmount>
  </TaxTotal>
  <LegalMonetaryTotal>
    <TaxExclusiveAmount>${num(net)}</TaxExclusiveAmount>
    <TaxInclusiveAmount>${num(gross)}</TaxInclusiveAmount>
    <AlreadyClaimedTaxExclusiveAmount>0</AlreadyClaimedTaxExclusiveAmount>
    <AlreadyClaimedTaxInclusiveAmount>0</AlreadyClaimedTaxInclusiveAmount>
    <DifferenceTaxExclusiveAmount>${num(net)}</DifferenceTaxExclusiveAmount>
    <DifferenceTaxInclusiveAmount>${num(gross)}</DifferenceTaxInclusiveAmount>
    <PayableRoundingAmount>0</PayableRoundingAmount>
    <PaidDepositsAmount>0</PaidDepositsAmount>
    <PayableAmount>${num(gross)}</PayableAmount>
  </LegalMonetaryTotal>${paymentMeans}
</Invoice>`;
}
