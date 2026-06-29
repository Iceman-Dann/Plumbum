import React, { useState, useEffect, useCallback } from "react";
import { lookupUtility, getGenericUtility, getStateFoiaLaw } from "../lib/utilityData";
import { generateFoiaLetterPdf } from "../lib/generateFoiaLetter";
import { buildFoiaLetterUs, buildFoiaLetterCa } from "../lib/foiaTemplates";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/foiaLetter.module.css";

interface Props {
  address: string;
  censusTract: string;
  country?: "us" | "ca";
}

export default function FoiaLetter({ address, censusTract, country }: Props) {
  const { t, lang } = useTranslation();

  const utility = censusTract
    ? (lookupUtility(censusTract) ?? getGenericUtility(censusTract))
    : getGenericUtility("");

  const foiaLaw = getStateFoiaLaw(censusTract, lang);

  const locale = lang === "es" ? "es-US" : "en-US";
  const today = new Date().toLocaleDateString(locale, {
    year: "numeric", month: "long", day: "numeric",
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [downloading, setDownloading] = useState(false);

  const isCanada = country === "ca";

  const rebuildLetter = useCallback((n: string, e: string) => {
    if (isCanada) {
      return buildFoiaLetterCa({ date: today, address: address || t.foia.addressPlaceholder, name: n, email: e, t });
    }
    return buildFoiaLetterUs({
      date: today,
      utilityName: utility.name,
      officerTitle: utility.foiaOfficerTitle,
      utilityAddress: utility.address,
      foiaLaw,
      address: address || t.foia.addressPlaceholder,
      name: n,
      email: e,
      t,
    });
  }, [today, utility, foiaLaw, address, isCanada, t]);

  useEffect(() => {
    setLetterText(rebuildLetter(name, email));
  }, [rebuildLetter, name, email]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    });
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await generateFoiaLetterPdf(letterText, name, t);
    } catch (err) {
      console.error("FOIA PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const genericUtilityName = lang === "es" ? "Su compañía de agua local" : "Your Local Water Utility";

  return (
    <section className={styles.foiaSection}>
      <div className={styles.container}>
        <div className={styles.sectionMeta}>{t.foia.sectionMeta}</div>
        <h2 className={styles.heading}>{t.foia.heading}</h2>
        <p className={styles.body}>
          {isCanada ? t.foia.bodyCa : t.foia.bodyUs}
        </p>

        {!isCanada && utility.name !== genericUtilityName && utility.name !== "Your Local Water Utility" && (
          <div className={styles.utilityBadge}>
            <span className={styles.utilityBadgeLabel}>{t.foia.utilityIdentified}</span>
            <span className={styles.utilityBadgeName}>{utility.name}</span>
          </div>
        )}

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="foia-name">{t.foia.yourName}</label>
            <input
              id="foia-name"
              type="text"
              className={styles.input}
              placeholder={t.foia.namePlaceholder}
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="foia-email">{t.foia.yourEmail}</label>
            <input
              id="foia-email"
              type="email"
              className={styles.input}
              placeholder={t.foia.emailPlaceholder}
              value={email}
              onChange={handleEmailChange}
            />
          </div>
        </div>

        <textarea
          className={styles.letterBox}
          value={letterText}
          onChange={e => setLetterText(e.target.value)}
          rows={28}
          spellCheck={false}
        />

        <div className={styles.buttonRow}>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copyState === "copied" ? t.foia.copied : t.foia.copyLetter}
          </button>
          <button
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? t.foia.generatingPdf : t.foia.downloadPdf}
          </button>
        </div>

        <p className={styles.disclaimer}>
          {isCanada ? t.foia.disclaimerCa : t.foia.disclaimer}
        </p>
      </div>
    </section>
  );
}
