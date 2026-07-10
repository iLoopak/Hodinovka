# Layout faktury (PDF) — referenční dokument

Doplňkový dokument k `roadmap.md`, pro Fázi 6 a 7. Popisuje rozložení PDF faktury, povinné náležitosti dle českého práva a strukturu pro implementaci v `@react-pdf/renderer`.

---

## 1. Zákonné náležitosti daňového dokladu (checklist)

Dle zákona o DPH (§29) a zákona o účetnictví musí faktura (daňový doklad) obsahovat:

- [ ] **Označení dokladu** — "Faktura" + číslo faktury (např. 2026-001)
- [ ] **Dodavatel** — obchodní jméno / jméno OSVČ, sídlo/adresa, IČO, DIČ (pokud je plátce DPH)
- [ ] **Odběratel** — název/jméno klienta, adresa, IČO, DIČ (pokud existuje)
- [ ] **Datum vystavení** (datum vystavení dokladu)
- [ ] **Datum zdanitelného plnění (DUZP)** — může se shodovat s datem vystavení, ale je to samostatné pole, pokud se liší
- [ ] **Datum splatnosti**
- [ ] **Označení zboží/služby** — popis položek (u vás: odpracované hodiny/projekt nebo fixní cena)
- [ ] **Jednotková cena, množství, celková cena** za položku
- [ ] **Celková částka k úhradě**
- [ ] **Sazba DPH a výše DPH** — POUZE pokud je uživatel plátce DPH; jinak text "Neplátce DPH" nebo "Dodavatel není plátcem DPH"
- [ ] **Číslo bankovního účtu** (+ IBAN pro zahraniční platby)
- [ ] **Variabilní symbol** (obvykle = číslo faktury bez pomlček/prefixu)
- [ ] **Forma úhrady** — např. "Bankovním převodem"

Nepovinné, ale běžné a uživatelsky očekávané:
- Logo dodavatele
- Razítko/podpis (obraz)
- Poznámka/patička (např. "Děkuji za spolupráci")
- QR platba (nice-to-have pro později — česká QR platba dle standardu SPD/CZ, ne v MVP)

---

## 2. Rozložení stránky (A4, portrait)

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]                              FAKTURA         │
│                                       č. 2026-001     │
│                                                        │
├─────────────────────────────────────────────────────┤
│  DODAVATEL                    │  ODBĚRATEL            │
│  Jméno / Firma                │  Název klienta         │
│  Adresa                       │  Adresa                │
│  IČO: XXXXXXXX                │  IČO: XXXXXXXX         │
│  DIČ: CZXXXXXXXX (pokud je)   │  DIČ: (pokud je)       │
│                                │                        │
├─────────────────────────────────────────────────────┤
│  Datum vystavení:   XX.XX.XXXX                        │
│  DUZP:               XX.XX.XXXX                        │
│  Datum splatnosti:   XX.XX.XXXX                        │
│  Variabilní symbol:  XXXXXXX                          │
│  Forma úhrady:       Bankovním převodem                │
│  Bankovní účet:      XXXX-XXXXXXXXXX/XXXX (IBAN: ...)  │
├─────────────────────────────────────────────────────┤
│  POLOŽKY                                              │
│  ┌───────────────────────┬──────┬────────┬─────────┐ │
│  │ Popis                 │ Množ.│ Kč/jedn│ Celkem  │ │
│  ├───────────────────────┼──────┼────────┼─────────┤ │
│  │ Vývoj — projekt X      │ 12 h │  800   │  9 600  │ │
│  │ Konzultace             │  2 h │  800   │  1 600  │ │
│  └───────────────────────┴──────┴────────┴─────────┘ │
│                                                        │
│                                    Celkem k úhradě:    │
│                                         11 200 Kč      │
│                                                        │
│  Neplátce DPH.                                        │
├─────────────────────────────────────────────────────┤
│  Poznámka: Děkuji za spolupráci.                       │
│                                                        │
│                                    [podpis/razítko]    │
└─────────────────────────────────────────────────────┘
```

**Barevný akcent** (`accentColor` z profilu): použít na nadpis "FAKTURA", na záhlaví tabulky položek, a jako tenkou linku oddělující sekce. Zbytek textu zůstává černý/šedý kvůli čitelnosti a tisku.

---

## 3. Tři varianty šablony (Fáze 6)

1. **Klasik — logo vlevo nahoře** — logo v levém rohu, "FAKTURA" + číslo vpravo nahoře, jako v layoutu výše.
2. **Klasik — logo vpravo nahoře** — zrcadlené rozložení, logo vpravo, číslo faktury vlevo. Pro uživatele, kteří chtějí branding vizuálně dominantní při prvním pohledu (logo je to, co oko zachytí jako první při čtení zleva doprava… ale to je diskutabilní, spíš jde o preferenci).
3. **Minimal — bez barevného bloku** — žádné barevné pozadí v záhlaví, jen tenká linka pod hlavičkou, logo malé v rohu. Pro uživatele, kteří chtějí střízlivý, "účetní" vzhled.

Implementačně: jedna sdílená datová struktura (`InvoiceData`), tři React komponenty (`TemplateClassicLeft`, `TemplateClassicRight`, `TemplateMinimal`) v `@react-pdf/renderer`, vybírané podle `businessProfile.templateId`.

---

## 4. Datová struktura předávaná do PDF rendereru

```ts
interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  taxableSupplyDate: string; // DUZP
  dueDate: string;
  variableSymbol: string;

  supplier: {
    name: string;
    address: string;
    ico: string;
    dic?: string;
    bankAccount: string;
    iban?: string;
  };

  customer: {
    name: string;
    address: string;
    ico?: string;
    dic?: string;
  };

  items: Array<{
    description: string;
    quantity: number;
    unit: string;       // "h" | "ks" | ...
    unitPrice: number;
    total: number;
  }>;

  totalAmount: number;
  isVatPayer: boolean;   // true → show VAT breakdown; false → show "Neplátce DPH"
  footerNote?: string;

  logoBlobUrl?: string;
  signatureBlobUrl?: string;
  accentColor: string;   // hex
  templateId: 'classic-left' | 'classic-right' | 'minimal';
}
```

---

## 5. Implementační poznámky pro Claude Code / Codex

- Použij `@react-pdf/renderer` — `Document`, `Page`, `View`, `Text`, `Image` komponenty s inline styly (StyleSheet.create), ne CSS soubory.
- Logo/podpis: převeď Blob z IndexedDB na `URL.createObjectURL()` před předáním do `<Image src={...} />`; po vygenerování PDF `URL.revokeObjectURL()` uvolni.
- Čísla formátuj česky: `1 234,50 Kč` (mezera jako oddělovač tisíců, čárka jako desetinná) — použij `Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' })`.
- Datumy ve formátu `DD.MM.YYYY`.
- Necheckni DIČ/IČO validaci striktně (jen formát, ne kontrolní součet) — riziko falešně odmítnutých platných dokladů je horší než mírná benevolence.
- Pro variantu bez DPH: pole "Sazba DPH" a "Výše DPH" se v layoutu úplně vynechají (ne jen skryjí prázdné hodnoty), aby doklad nepůsobil rozbitě.
