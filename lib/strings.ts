/**
 * Centrální soubor s českými texty aplikace.
 *
 * Veškerá viditelná copy patří sem — i kdyby se zatím používala jen na jednom
 * místě. Kdyby v budoucnu přišla podpora angličtiny, měníme jen tento soubor
 * (příp. z něj uděláme slovník podle jazyka).
 */

/** České skloňování slova „záznam" podle počtu (1 záznam / 2–4 záznamy / 5 záznamů). */
function pluralZaznam(n: number): string {
  if (n === 1) return "záznam";
  if (n >= 2 && n <= 4) return "záznamy";
  return "záznamů";
}

export const strings = {
  app: {
    name: "Hodinovka",
    tagline: "Fakturace a výkazy práce",
  },

  nav: {
    prehled: "Přehled",
    prace: "Práce",
    klienti: "Klienti",
    faktury: "Faktury",
    projekty: "Projekty",
    vykazy: "Výkazy práce",
    nastaveni: "Nastavení",
  },

  prehled: {
    title: "Přehled",
    greetingMorning: "Dobré ráno",
    greetingDay: "Dobrý den",
    greetingEvening: "Dobrý večer",
    unbilledLabel: "Nevyfakturováno",
    unbilledSubEmpty: "Zatím nemáte zapsanou žádnou práci k fakturaci.",
    unbilledSub: (hours: string) => `${hours} h připravených k fakturaci`,
    onboardingTitle: "Vítejte v Hodinovce",
    onboardingSub:
      "Zapisujte odpracovaný čas, sledujte nevyfakturovanou hodnotu a vystavujte faktury — vše lokálně ve vašem zařízení.",
    pipelineWork: "Práce",
    pipelineValue: "Hodnota",
    pipelineInvoice: "Faktura",
    pipelinePaid: "Zaplaceno",
    logWork: "Zapsat práci",
    logWorkDesc: "Odpracované hodiny",
    newInvoice: "Nová faktura",
    newInvoiceDesc: "Vystavit doklad",
    unbilledByClient: "Nevyfakturováno podle klienta",
    recentWork: "Poslední práce",
    recentWorkEmpty: "Zatím žádná zapsaná práce.",
    viewAll: "Zobrazit vše",
    attention: "Vyžaduje pozornost",
    attentionEmpty: "Žádné faktury po splatnosti ani před splatností.",
    summary: "Souhrn",
    statsClients: "Klienti",
    statsProjects: "Aktivní projekty",
    statsUnbilledHours: "Nevyfakt. hodiny",
    upcoming: "Připravujeme",
  },

  klienti: {
    title: "Klienti",
    empty: "Zatím tu nejsou žádní klienti.",
    emptyHint: "Přidejte prvního klienta pomocí IČO nebo ručně.",
    add: "Nový klient",
    search: "Hledat podle jména nebo IČO…",
    noResults: "Žádný klient neodpovídá hledání.",
    newTitle: "Nový klient",
    editTitle: "Upravit klienta",
    notFound: "Klient nenalezen.",
    // Sekce v detailu
    contact: "Kontakt",
    contactBilling: "Kontakt a fakturační údaje",
    projects: "Projekty",
    work: "Výkazy práce",
    invoices: "Faktury",
    noProjects: "Zatím žádné projekty.",
    noProjectsHint: "Přidejte projekt a začněte sledovat odpracovaný čas.",
    noWork: "Zatím žádná zapsaná práce.",
    noInvoices: "Zatím žádné faktury.",
    unbilled: "Nevyfakturováno",
    newProject: "Nový projekt",
    newInvoice: "Nová faktura",
    // Mazání
    deleteConfirm: "Opravdu smazat tohoto klienta?",
    deleteWarnLinked:
      "Na klienta jsou navázané projekty nebo faktury. Smazáním o ně přijdete.",
    // Pole formuláře
    fields: {
      ico: "IČO",
      loadFromAres: "Načíst z ARES",
      loading: "Načítám z ARES…",
      name: "Název / jméno",
      dic: "DIČ",
      address: "Adresa",
      street: "Ulice",
      streetNumber: "Číslo popisné/orientační",
      city: "Město / obec",
      zip: "PSČ",
      email: "E-mail",
      phone: "Telefon",
      defaultRate: "Výchozí hodinová sazba",
      currency: "Měna",
      notes: "Poznámky",
    },
    nameRequired: "Vyplňte název klienta.",
    icoInvalid: "IČO obvykle má 8 číslic.",
    saved: "Klient uložen.",
    createInline: "Vytvořit klienta",
  },

  projekty: {
    title: "Projekty",
    empty: "Zatím tu nejsou žádné projekty.",
    emptyHint: "Vytvořte projekt a přiřaďte ho ke klientovi (nebo rovnou založte nového).",
    add: "Nový projekt",
    search: "Hledat projekt…",
    noResults: "Žádný projekt neodpovídá hledání.",
    newTitle: "Nový projekt",
    editTitle: "Upravit projekt",
    notFound: "Projekt nenalezen.",
    // Sekce v detailu
    info: "O projektu",
    timeEntries: "Výkazy práce",
    invoices: "Faktury",
    noTimeEntries: "Zatím žádné výkazy práce.",
    noInvoices: "Zatím žádné faktury.",
    newInvoice: "Nová faktura",
    // Stavy
    statusActive: "Aktivní",
    statusEnded: "Ukončený",
    // Mazání
    deleteConfirm: "Opravdu smazat tento projekt?",
    deleteWarnLinked:
      "Na projekt jsou navázané výkazy práce nebo faktury. Smazáním o vazbu přijdete.",
    // Pole formuláře
    fields: {
      client: "Klient",
      selectClient: "Vyberte klienta…",
      name: "Název projektu",
      description: "Popis",
      startDate: "Začátek",
      endDate: "Konec",
      billingType: "Typ fakturace",
      hourly: "Hodinová sazba",
      fixed: "Fixní cena",
      rateHourly: "Hodinová sazba (Kč/h)",
      rateFixed: "Fixní cena (Kč)",
      notes: "Poznámky",
    },
    nameRequired: "Vyplňte název projektu.",
    clientRequired: "Vyberte klienta.",
    dateOrder: "Konec nemůže být dřív než začátek.",
    noClients: "Nejdřív si vytvořte klienta.",
  },

  vykazy: {
    title: "Výkazy práce",
    add: "Nový záznam",
    newTitle: "Nový záznam práce",
    editTitle: "Upravit záznam",
    notFound: "Záznam nenalezen.",

    empty: "Zatím tu nejsou žádné záznamy práce.",
    emptyHint: "Zapište odpracované hodiny ke klientovi nebo projektu.",
    emptyMonth: "V tomto měsíci nemáte žádné záznamy.",
    emptyMonthHint: "Zvolte jiný měsíc nebo zapište nový záznam.",

    // Filtry
    allClients: "Všichni klienti",
    allProjects: "Všechny projekty",
    month: "Měsíc",

    // Souhrn
    summaryHours: "Odpracováno",
    summaryUnbilled: "Nevyfakturováno",
    billedBadge: "Vyfakturováno",
    unbilledBadge: "Nevyfakturováno",
    noProjectLabel: "Bez projektu",

    // Stopky
    timer: {
      title: "Stopky",
      descriptionPlaceholder: "Na čem pracujete? (nepovinné)",
      start: "Spustit",
      running: "Měřím čas",
      stop: "Zastavit a uložit",
      stopShort: "Zastavit",
      discard: "Zahodit",
      discardConfirm: "Zahodit měření bez uložení?",
    },

    // Formulář
    fields: {
      client: "Klient",
      selectClient: "Vyberte klienta…",
      project: "Projekt",
      noProject: "— bez projektu —",
      date: "Datum",
      duration: "Doba práce",
      hours: "hodin",
      minutes: "minut",
      description: "Popis práce",
    },
    clientRequired: "Vyberte klienta.",
    durationRequired: "Zadejte dobu práce.",
    deleteConfirm: "Opravdu smazat tento záznam?",
    deleteBilledWarn:
      "Tento záznam je už navázaný na fakturu. Smazáním se vazba ztratí.",
  },

  faktury: {
    title: "Faktury",
    empty: "Zatím tu nejsou žádné faktury.",
    emptyHint: "Vytvořte fakturu z nevyfakturovaných výkazů práce.",
    emptyClientHint: "U tohoto klienta zatím není žádná faktura.",
    add: "Nová faktura",
    newTitle: "Nová faktura",
    notFound: "Faktura nenalezena.",

    // Výběr rozsahu a zdroje
    params: "Z čeho vystavit",
    loadFromWork: "Předvyplnit z výkazů práce",
    workSource: "Z výkazů práce",
    hide: "Skrýt",
    allClientProjects: "Všechny projekty klienta",
    rangeFrom: "Od",
    rangeTo: "Do",
    mode: "Rozdělení položek",
    modePerEntry: "Po záznamech",
    modePerProject: "Sečíst po projektech",
    generate: "Načíst nevyfakturované výkazy",
    regenerate: "Načíst znovu",
    noUnbilled: "V tomto období nejsou žádné nevyfakturované výkazy.",
    includedCount: (n: number) => `Zahrnuto ${n} ${pluralZaznam(n)}`,

    // Položky
    itemsTitle: "Položky faktury",
    addItem: "Přidat položku",
    itemDescription: "Popis",
    itemQty: "Množství",
    itemUnit: "MJ",
    itemPrice: "Cena/MJ",
    itemTotal: "Celkem",
    itemVat: "DPH",
    noItems: "Faktura nemá žádné položky.",
    total: "Celkem k úhradě",

    // DPH
    withVatBadge: "Faktura s DPH",
    withVatHint: "Jste plátce DPH — k položkám se přičítá DPH.",
    vatRateLabel: "Sazba DPH",
    totalNet: "Základ daně",
    vatAmount: "DPH",
    totalGross: "Celkem s DPH",
    vatRecap: "Rekapitulace DPH",

    // Údaje faktury
    detailsTitle: "Údaje faktury",
    number: "Číslo faktury",
    issueDate: "Datum vystavení",
    taxableSupplyDate: "DUZP",
    dueDate: "Datum splatnosti",
    vs: "Variabilní symbol",
    save: "Uložit fakturu",

    // Detail
    items: "Položky",
    markIssued: "Označit jako vystavenou",
    markPaid: "Označit jako zaplacenou",
    markDraft: "Vrátit na koncept",
    deleteConfirm:
      "Opravdu smazat fakturu? Navázané výkazy se opět označí jako nevyfakturované.",

    // Export PDF
    exportTitle: "Export",
    pdfDownload: "Stáhnout PDF",
    pdfShare: "Sdílet / Odeslat e-mailem",
    pdfGenerating: "Generuji PDF…",
    pdfManualAttach:
      "PDF bylo staženo — přiložte ho prosím ručně k e-mailu (otevřeli jsme koncept).",
    pdfError: "PDF se nepodařilo vytvořit.",
    pdfProfileHint:
      "Tip: doplňte si firemní profil v Nastavení, aby faktura obsahovala údaje dodavatele.",
    mailSubject: (num: string) => `Faktura ${num}`,
    mailBody: (num: string) =>
      `Dobrý den,\n\nv příloze zasílám fakturu ${num}.\n\nS pozdravem`,

    // Texty přímo v PDF (daňový doklad)
    pdf: {
      title: "FAKTURA",
      numberPrefix: "č.",
      supplier: "DODAVATEL",
      customer: "ODBĚRATEL",
      ico: "IČO",
      dic: "DIČ",
      issueDate: "Datum vystavení",
      taxableSupplyDate: "DUZP",
      dueDate: "Datum splatnosti",
      vs: "Variabilní symbol",
      paymentMethod: "Forma úhrady",
      paymentMethodValue: "Bankovním převodem",
      bankAccount: "Bankovní účet",
      iban: "IBAN",
      itemDescription: "Popis",
      itemQty: "Množství",
      itemUnitPrice: "Cena/MJ",
      itemVat: "DPH",
      itemTotal: "Celkem",
      total: "Celkem k úhradě",
      notVatPayer: "Dodavatel není plátcem DPH.",
      note: "Poznámka",
      // Rekapitulace DPH
      vatRecap: "Rekapitulace DPH",
      vatRate: "Sazba",
      vatBase: "Základ",
      vatColAmount: "DPH",
      totalNet: "Celkem bez DPH",
      vatTotal: "DPH celkem",
    },

    clientRequired: "Vyberte klienta.",
    itemsRequired: "Faktura musí mít alespoň jednu položku.",

    statuses: {
      draft: "Koncept",
      issued: "Vystavena",
      dueSoon: "Blíží se splatnost",
      overdue: "Po splatnosti",
      paid: "Zaplaceno",
    },
  },

  nastaveni: {
    title: "Nastavení",
    subtitle: "Firemní profil pro faktury",

    profileTitle: "Můj profil / Firma",
    profileHint:
      "Tyto údaje se propíšou do každé faktury jako dodavatel. Vše zůstává jen ve vašem zařízení.",
    fields: {
      name: "Název / jméno",
      address: "Adresa",
      addressHint: "Ulice a číslo, PSČ a město — každé na svůj řádek.",
      ico: "IČO",
      dic: "DIČ",
      vatPayer: "Jsem plátce DPH",
      bankAccount: "Číslo účtu",
      iban: "IBAN",
      paymentTerms: "Platební podmínky",
      paymentTermsPlaceholder: "Např. Platba převodem do 14 dnů.",
      footerNote: "Poznámka v patičce",
      footerNotePlaceholder: "Např. Nejsem plátce DPH. Děkuji za spolupráci.",
    },

    brandingTitle: "Vzhled faktury",
    logo: "Logo",
    signature: "Podpis / razítko",
    imageHint: "PNG nebo JPG. Obrázek se automaticky zmenší (max 600 px).",
    addImage: "Nahrát obrázek",
    changeImage: "Změnit",
    removeImage: "Odebrat",

    accent: "Barva zvýraznění",
    accentHint: "Použije se v celé aplikaci i v hlavičce a tabulce faktury (uloží se po stisknutí Uložit profil).",

    template: "Šablona",
    templates: {
      "classic-left": "Klasická — logo vlevo",
      "classic-right": "Klasická — logo vpravo",
      minimal: "Minimalistická",
    } as Record<string, string>,

    previewTitle: "Náhled hlavičky",
    previewNote: "Kompletní PDF a odeslání e-mailem přijde ve Fázi 7.",
    supplier: "Dodavatel",
    emptyName: "Název vaší firmy",
    faktura: "FAKTURA",

    save: "Uložit profil",
    saved: "Profil uložen.",

    // Data a zálohování
    backupTitle: "Data a zálohování",
    backupHint:
      "Všechna data jsou uložená jen ve vašem zařízení — žádná cloudová záloha neexistuje. Pravidelně si data zálohujte do souboru a schovejte ho na bezpečné místo.",
    backupExport: "Zálohovat data",
    backupExporting: "Připravuji zálohu…",
    backupImport: "Obnovit ze zálohy",
    backupImporting: "Obnovuji…",
    backupConfirm:
      "Obnovení nahradí VŠECHNA současná data daty ze zálohy. Tuto akci nelze vzít zpět. Pokračovat?",
    backupRestored: (c: number, p: number, t: number, i: number) =>
      `Obnoveno: ${c} klientů, ${p} projektů, ${t} výkazů, ${i} faktur. Načítám znovu…`,
    backupError: "Zálohu se nepodařilo načíst.",
  },

  common: {
    save: "Uložit",
    cancel: "Zrušit",
    edit: "Upravit",
    delete: "Smazat",
    back: "Zpět",
    loading: "Načítám…",
  },
} as const;

export type Strings = typeof strings;
