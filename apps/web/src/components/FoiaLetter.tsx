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
  isSchoolContext?: boolean;
  schoolName?: string;
}

export default function FoiaLetter({ address, censusTract, country, isSchoolContext, schoolName }: Props) {
  const { t, lang } = useTranslation();

  const utility = censusTract
    ? (lookupUtility(censusTract) ?? getGenericUtility(censusTract))
    : getGenericUtility("");

  const foiaLaw = getStateFoiaLaw(censusTract, lang === "es" ? "es" : "en");

  const locale = lang === "es" ? "es-US" : "en-US";
  const today = new Date().toLocaleDateString(locale, {
    year: "numeric", month: "long", day: "numeric",
  });

  const [name, setName] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [downloading, setDownloading] = useState(false);

  const isCanada = country === "ca";

  const rebuildLetter = useCallback((n: string) => {
    if (isSchoolContext) {
      return `${today}

Records Custodian / FOIA Officer
[School District Name / Superintendent's Office]
[School District Address]

SUBJECT: Public Records / FOIA Request: Lead Water Testing Records for ${schoolName || "[School Name]"}

To the Records Custodian / FOIA Officer:

Under the ${foiaLaw || "[State Freedom of Information Act]"}, I hereby request copies of public records regarding lead water testing, remediation, and service line/fixture surveys for ${schoolName || "[School Name]"}, located at ${address || "[Address]"}.

Specifically, I request the following records:
1. All results from drinking water testing conducted at ${schoolName || "[School Name]"} for lead and copper within the last five (5) years.
2. Records of any corrective or remediation actions taken in response to elevated lead levels (exceeding 10 ppb), including fixture shut-offs, replacements, or filter installations.
3. The facility's water fixture inventory and service line material logs showing the presence of any known or suspected lead infrastructure.

As provided by law, I look forward to your response within the statutory timeline. If any fees are associated with this request, please notify me in advance.

Sincerely,

${n || "[your name]"}

${today}`;
    }

    if (isCanada) {
      return buildFoiaLetterCa({ date: today, address: address || t.foia.addressPlaceholder, name: n, email: "", t });
    }
    return buildFoiaLetterUs({
      date: today,
      utilityName: utility.name,
      officerTitle: utility.foiaOfficerTitle,
      utilityAddress: utility.address,
      foiaLaw,
      address: address || t.foia.addressPlaceholder,
      name: n,
      email: "",
      t,
    });
  }, [today, utility, foiaLaw, address, isCanada, t, isSchoolContext, schoolName]);

  useEffect(() => {
    setLetterText(rebuildLetter(name));
  }, [rebuildLetter, name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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
        <div className={styles.sectionMeta}>
          {isSchoolContext ? "SCHOOL RECORDS REQUEST" : t.foia.sectionMeta}
        </div>
        <h2 className={styles.heading}>
          {isSchoolContext ? "Freedom of Information Act Request" : t.foia.heading}
        </h2>
        <p className={styles.body}>
          {isSchoolContext
            ? "Use this template to request water quality logs, lead testing results, or remediation timelines from your school district's FOIA officer or records custodian."
            : (isCanada ? t.foia.bodyCa : t.foia.bodyUs)}
        </p>

        {!isSchoolContext && !isCanada && utility.name !== genericUtilityName && utility.name !== "Your Local Water Utility" && (
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
        </div>

        <textarea
          className={styles.letterBox}
          value={letterText}
          onChange={e => setLetterText(e.target.value)}
          rows={28}
          spellCheck={false}
          aria-label="FOIA request text preview — editable"
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
          {isSchoolContext
            ? "Fill in [School District Name / Superintendent's Office] and [School District Address] in the letter body before copying or downloading. Seek local advocacy groups if the district does not comply within the statutory timeframe."
            : (isCanada ? t.foia.disclaimerCa : t.foia.disclaimer)}
        </p>
      </div>
    </section>
  );
}
