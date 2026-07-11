"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, type BusinessProfile } from "@/lib/db";
import { fetchAresByIco, AresError } from "@/lib/ares";
import { strings } from "@/lib/strings";
import {
  PROFILE_ID,
  DEFAULT_ACCENT,
  TEMPLATES,
  type TemplateId,
  saveProfile,
  downscaleImage,
} from "@/lib/profile";
import { PageHeader } from "@/components/PageHeader";
import { IconImage, IconCheck, IconSearch } from "@/components/icons";

const s = strings.nastaveni;

/** Vytvoří dočasnou URL pro Blob a po odmontování ji uklidí. */
function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export default function NastaveniPage() {
  // undefined = načítám, null = profil ještě neexistuje.
  const profile = useLiveQuery(
    () => getDb().businessProfile.get(PROFILE_ID).then((p) => p ?? null),
    []
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [ico, setIco] = useState("");
  const [dic, setDic] = useState("");
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [iban, setIban] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [templateId, setTemplateId] = useState<TemplateId>("classic-left");
  const [logo, setLogo] = useState<Blob | null>(null);
  const [signature, setSignature] = useState<Blob | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [aresLoading, setAresLoading] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const didInit = useRef(false);

  // Naplníme formulář jednou, až se profil načte (i když neexistuje → defaulty).
  useEffect(() => {
    if (didInit.current || profile === undefined) return;
    didInit.current = true;
    if (profile) {
      setName(profile.name ?? "");
      setAddress(profile.address ?? "");
      setIco(profile.ico ?? "");
      setDic(profile.dic ?? "");
      setIsVatPayer(profile.isVatPayer ?? false);
      setBankAccount(profile.bankAccount ?? "");
      setIban(profile.iban ?? "");
      setPaymentTerms(profile.paymentTerms ?? "");
      setFooterNote(profile.footerNote ?? "");
      setAccentColor(profile.accentColor ?? DEFAULT_ACCENT);
      setTemplateId(profile.templateId ?? "classic-left");
      setLogo(profile.logo ?? null);
      setSignature(profile.signature ?? null);
    }
  }, [profile]);

  const logoUrl = useObjectUrl(logo);
  const signatureUrl = useObjectUrl(signature);

  async function handleAres() {
    setAresError(null);
    setAresLoading(true);
    try {
      const r = await fetchAresByIco(ico);
      if (r.name) setName(r.name);
      if (r.dic) setDic(r.dic);
      if (r.ico) setIco(r.ico);
      // Adresu poskládáme do víceřádkového pole: ulice s číslem, PSČ a obec.
      const addrLines = [
        [r.street, r.streetNumber].filter(Boolean).join(" "),
        [r.zip, r.city].filter(Boolean).join(" "),
      ].filter(Boolean);
      if (addrLines.length) setAddress(addrLines.join("\n"));
    } catch (err) {
      setAresError(err instanceof AresError ? err.message : "Načtení z ARES selhalo.");
    } finally {
      setAresLoading(false);
    }
  }

  async function onPickImage(
    e: React.ChangeEvent<HTMLInputElement>,
    set: (b: Blob) => void
  ) {
    const file = e.target.files?.[0];
    e.target.value = ""; // umožní znovu vybrat stejný soubor
    if (!file) return;
    try {
      set(await downscaleImage(file));
    } catch {
      /* neplatný obrázek ignorujeme */
    }
  }

  async function save() {
    setSaving(true);
    const record: Omit<BusinessProfile, "id"> = {
      name: name.trim() || undefined,
      address: address.trim() || undefined,
      ico: ico.trim() || undefined,
      dic: dic.trim() || undefined,
      isVatPayer,
      bankAccount: bankAccount.trim() || undefined,
      iban: iban.trim() || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      footerNote: footerNote.trim() || undefined,
      accentColor,
      templateId,
      logo: logo ?? undefined,
      signature: signature ?? undefined,
    };
    await saveProfile(record);
    setSaving(false);
    setSavedAt(Date.now());
  }

  // Skryjeme „uloženo" po pár sekundách.
  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(0), 2500);
    return () => clearTimeout(t);
  }, [savedAt]);

  const loading = profile === undefined;

  return (
    <>
      <PageHeader title={s.title} subtitle={s.subtitle} />

      {loading ? (
        <p className="loading-text">{strings.common.loading}</p>
      ) : (
        <div className="form">
          {/* Firemní údaje */}
          <section className="panel">
            <div className="section-header">
              <h2>{s.profileTitle}</h2>
            </div>
            <p className="panel-note">{s.profileHint}</p>

            <div className="field">
              <label htmlFor="name">{s.fields.name}</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="address">{s.fields.address}</label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <p className="field-hint">{s.fields.addressHint}</p>
            </div>

            <div className="field">
              <label htmlFor="ico">{s.fields.ico}</label>
              <div className="ico-lookup">
                <input
                  id="ico"
                  inputMode="numeric"
                  value={ico}
                  onChange={(e) => setIco(e.target.value)}
                  placeholder="12345678"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAres}
                  disabled={aresLoading}
                >
                  <IconSearch />
                  {aresLoading ? strings.klienti.fields.loading : strings.klienti.fields.loadFromAres}
                </button>
              </div>
              {aresError && <p className="field-error">{aresError}</p>}
            </div>

            <div className="field">
              <label htmlFor="dic">{s.fields.dic}</label>
              <input id="dic" value={dic} onChange={(e) => setDic(e.target.value)} />
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={isVatPayer}
                onChange={(e) => setIsVatPayer(e.target.checked)}
              />
              <span>{s.fields.vatPayer}</span>
            </label>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="bank">{s.fields.bankAccount}</label>
                <input id="bank" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="iban">{s.fields.iban}</label>
                <input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="terms">{s.fields.paymentTerms}</label>
              <textarea
                id="terms"
                rows={2}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder={s.fields.paymentTermsPlaceholder}
              />
            </div>

            <div className="field">
              <label htmlFor="footer">{s.fields.footerNote}</label>
              <textarea
                id="footer"
                rows={2}
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder={s.fields.footerNotePlaceholder}
              />
            </div>
          </section>

          {/* Vzhled faktury */}
          <section className="panel">
            <div className="section-header">
              <h2>{s.brandingTitle}</h2>
            </div>

            <div className="image-upload-grid">
              <ImageField
                label={s.logo}
                url={logoUrl}
                onPick={(e) => onPickImage(e, setLogo)}
                onRemove={() => setLogo(null)}
              />
              <ImageField
                label={s.signature}
                url={signatureUrl}
                onPick={(e) => onPickImage(e, setSignature)}
                onRemove={() => setSignature(null)}
              />
            </div>
            <p className="field-hint">{s.imageHint}</p>

            <div className="field">
              <label htmlFor="accent">{s.accent}</label>
              <div className="accent-field">
                <input
                  id="accent"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  aria-label={s.accent}
                />
                <input
                  className="accent-hex tnum"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <p className="field-hint">{s.accentHint}</p>
            </div>

            <div className="field">
              <label>{s.template}</label>
              <div className="template-grid" role="radiogroup" aria-label={s.template}>
                {TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={templateId === t}
                    className="template-option"
                    data-active={templateId === t}
                    onClick={() => setTemplateId(t)}
                  >
                    <TemplateThumb template={t} accent={accentColor} />
                    <span>{s.templates[t]}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Náhled */}
          <section className="panel">
            <div className="section-header">
              <h2>{s.previewTitle}</h2>
            </div>
            <InvoiceHeaderPreview
              name={name}
              address={address}
              ico={ico}
              accent={accentColor}
              template={templateId}
              logoUrl={logoUrl}
            />
            <p className="field-hint">{s.previewNote}</p>
          </section>

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {savedAt ? (
                <>
                  <IconCheck size={18} /> {s.saved}
                </>
              ) : (
                s.save
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ImageField({
  label,
  url,
  onPick,
  onRemove,
}: {
  label: string;
  url: string | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="image-field">
      <span className="image-field-label">{label}</span>
      <div className="image-preview" data-empty={!url}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} />
        ) : (
          <IconImage size={26} />
        )}
      </div>
      <div className="image-actions">
        <label className="btn btn-secondary btn-sm">
          {url ? strings.nastaveni.changeImage : strings.nastaveni.addImage}
          <input type="file" accept="image/*" onChange={onPick} hidden />
        </label>
        {url && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>
            {strings.nastaveni.removeImage}
          </button>
        )}
      </div>
    </div>
  );
}

/** Malý schematický náhled rozvržení v přepínači šablon. */
function TemplateThumb({ template, accent }: { template: TemplateId; accent: string }) {
  return (
    <span
      className="template-thumb"
      data-template={template}
      style={{ ["--preview-accent" as string]: accent }}
      aria-hidden="true"
    >
      <span className="tt-bar" />
      <span className="tt-head">
        <span className="tt-logo" />
        <span className="tt-lines">
          <span />
          <span />
        </span>
      </span>
      <span className="tt-rows">
        <span />
        <span />
      </span>
    </span>
  );
}

function InvoiceHeaderPreview({
  name,
  address,
  ico,
  accent,
  template,
  logoUrl,
}: {
  name: string;
  address: string;
  ico: string;
  accent: string;
  template: TemplateId;
  logoUrl: string | null;
}) {
  const lines = address.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div
      className="invoice-preview"
      data-template={template}
      style={{ ["--preview-accent" as string]: accent }}
    >
      <div className="ip-bar" />
      <div className="ip-head">
        <div className="ip-logo" data-empty={!logoUrl}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            <IconImage size={22} />
          )}
        </div>
        <div className="ip-supplier">
          <span className="ip-eyebrow">{strings.nastaveni.supplier}</span>
          <strong>{name.trim() || strings.nastaveni.emptyName}</strong>
          {lines.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
          {ico.trim() && <span>IČO {ico.trim()}</span>}
        </div>
      </div>
      <div className="ip-title">
        <span className="ip-faktura">{strings.nastaveni.faktura}</span>
        <span className="ip-num tnum">2026-001</span>
      </div>
      <div className="ip-table">
        <div className="ip-row ip-row-head">
          <span>{strings.faktury.itemDescription}</span>
          <span>{strings.faktury.itemTotal}</span>
        </div>
        <div className="ip-row">
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
