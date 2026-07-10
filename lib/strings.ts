/**
 * Centrální soubor s českými texty aplikace.
 *
 * Veškerá viditelná copy patří sem — i kdyby se zatím používala jen na jednom
 * místě. Kdyby v budoucnu přišla podpora angličtiny, měníme jen tento soubor
 * (příp. z něj uděláme slovník podle jazyka).
 */

export const strings = {
  app: {
    name: "Hodinovka",
    tagline: "Fakturace a výkazy práce",
  },

  nav: {
    klienti: "Klienti",
    projekty: "Projekty",
    vykazy: "Výkazy práce",
    faktury: "Faktury",
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
    projects: "Projekty",
    invoices: "Faktury",
    noProjects: "Zatím žádné projekty.",
    noInvoices: "Zatím žádné faktury.",
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
      email: "E-mail",
      phone: "Telefon",
      defaultRate: "Výchozí hodinová sazba",
      currency: "Měna",
      notes: "Poznámky",
    },
    nameRequired: "Vyplňte název klienta.",
    saved: "Klient uložen.",
  },

  projekty: {
    title: "Projekty",
    empty: "Zatím tu nejsou žádné projekty.",
    emptyHint: "Projekty se vytvářejí u konkrétního klienta.",
    add: "Nový projekt",
  },

  vykazy: {
    title: "Výkazy práce",
    empty: "Zatím tu nejsou žádné záznamy práce.",
    emptyHint: "Zaznamenejte odpracované hodiny k projektu nebo klientovi.",
    add: "Nový záznam",
  },

  faktury: {
    title: "Faktury",
    empty: "Zatím tu nejsou žádné faktury.",
    emptyHint: "Vytvořte fakturu z výkazů práce nebo ručně.",
    add: "Nová faktura",
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
