import React, { useState, useEffect, useCallback } from "react";
import { lookupUtility, getGenericUtility, getStateFoiaLaw } from "../lib/utilityData";
import { generateFoiaLetterPdf } from "../lib/generateFoiaLetter";
import styles from "../styles/foiaLetter.module.css";

interface Props {
  address: string;
  censusTract: string;
}

function buildLetter(opts: {
  date: string;
  utilityName: string;
  officerTitle: string;
  utilityAddress: string;
  foiaLaw: string;
  address: string;
  name: string;
  email: string;
}): string {
  const { date, utilityName, officerTitle, utilityAddress, foiaLaw, address, name, email } = opts;
  return `${date}

${officerTitle}
${utilityName}
${utilityAddress}

Re: Public Records Request — Lead Service Line Inventory

Dear Records Officer,

Pursuant to ${foiaLaw}, I hereby request a copy of your complete lead service line inventory for the service area covering ${address}. Specifically I request:

  (1) The number and location of known lead service lines in your system;
  (2) Any lead service line replacement schedules currently in effect; and
  (3) All Lead and Copper Rule compliance reports filed with the EPA in the past five years.

I request that this information be provided within the statutory deadline. If any portion of this request is denied, please provide a written explanation citing the specific statutory exemption relied upon.

Thank you for your assistance in this matter.

Sincerely,

${name || "[Your Full Name]"}

${email || "[Your Email Address]"}

${date}`;
}

export default function FoiaLetter({ address, censusTract }: Props) {
  const utility = censusTract
    ? (lookupUtility(censusTract) ?? getGenericUtility(censusTract))
    : getGenericUtility("");

  const foiaLaw = censusTract
    ? (lookupUtility(censusTract)?.stateFoiaLaw ?? getStateFoiaLaw(censusTract))
    : "applicable state public records law";

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [downloading, setDownloading] = useState(false);

  const rebuildLetter = useCallback((n: string, e: string) => {
    return buildLetter({
      date: today,
      utilityName: utility.name,
      officerTitle: utility.foiaOfficerTitle,
      utilityAddress: utility.address,
      foiaLaw,
      address: address || "[Address]",
      name: n,
      email: e,
    });
  }, [today, utility, foiaLaw, address]);

  useEffect(() => {
    setLetterText(rebuildLetter(name, email));
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.value;
    setName(n);
    // Replace name token in current letter text
    setLetterText(prev =>
      prev.replace(/^(Sincerely,\n\n).*/m, `$1${n || "[Your Full Name]"}`)
    );
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const em = e.target.value;
    setEmail(em);
    // Replace email token in current letter text
    setLetterText(prev => {
      const nameVal = name || "[Your Full Name]";
      return prev.replace(
        new RegExp(`(${nameVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n\\n).+`),
        `$1${em || "[Your Email Address]"}`
      );
    });
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
      await generateFoiaLetterPdf(letterText, name);
    } catch (err) {
      console.error("FOIA PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className={styles.foiaSection}>
      <div className={styles.container}>
        <div className={styles.sectionMeta}>LEGAL TOOLS</div>
        <h2 className={styles.heading}>Request your utility's lead pipe records.</h2>
        <p className={styles.body}>
          Under state public records law, you have the right to request your water utility's
          full lead service line inventory. We've drafted the letter for you.
        </p>

        {utility.name !== "Your Local Water Utility" && (
          <div className={styles.utilityBadge}>
            <span className={styles.utilityBadgeLabel}>UTILITY IDENTIFIED</span>
            <span className={styles.utilityBadgeName}>{utility.name}</span>
          </div>
        )}

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="foia-name">Your name</label>
            <input
              id="foia-name"
              type="text"
              className={styles.input}
              placeholder="Jane Smith"
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="foia-email">Your email</label>
            <input
              id="foia-email"
              type="email"
              className={styles.input}
              placeholder="jane@example.com"
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
            {copyState === "copied" ? "✓ Copied to clipboard" : "Copy letter"}
          </button>
          <button
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Generating PDF…" : "Download as PDF ↗"}
          </button>
        </div>

        <p className={styles.disclaimer}>
          Plumbum does not provide legal advice. This template is provided as a civic resource
          based on standard FOIA request language.
        </p>
      </div>
    </section>
  );
}
