import React, { useState, useEffect, useCallback } from "react";
import { generatePediatricianLetter, type PediatricianLetterData } from "../lib/generatePediatricianLetter";
import styles from "../styles/pediatricianLetter.module.css";

interface Factor {
  name: string;
  detail: string;
  score: number;
  max: number;
}

interface Props {
  address: string;
  score: number;
  riskLevel: string;
  factors: Factor[];
  censusTract: string;
  pctPre1986?: number | null;
  isPregnant?: boolean;
}

function buildLetterText(
  parentName: string,
  childName: string,
  childDob: string,
  pediatricianName: string,
  address: string,
  score: number,
  riskLevel: string,
  factors: Factor[],
  censusTract: string,
  pctPre1986: number | null | undefined,
  today: string,
  isPregnant: boolean = false,
): string {
  const salutation = pediatricianName.trim()
    ? `Dear ${pediatricianName.trim()},`
    : isPregnant ? "Dear Obstetrician/Provider," : "To Whom It May Concern,";
  const childStr  = childName.trim()  || "[child name]";
  const dobStr    = childDob.trim()   || "[date of birth]";
  const parentStr = parentName.trim() || (isPregnant ? "[patient name]" : "[parent/guardian name]");
  const pre1986Str = pctPre1986 != null ? `${pctPre1986}%` : "a significant percentage";

  const factorLines = factors
    .map(f => `  · ${f.name} (${f.score}/${f.max}): ${f.detail}`)
    .join("\n");

  return `${today}

${salutation}

I am writing to formally request a blood lead level (BLL) test for ${isPregnant ? "myself at my next prenatal visit" : `my child, ${childStr}, date of birth ${dobStr}`}.

Our home address is ${address}, which has been assessed by Plumbum (plumbummap.org), an open-source public health research tool built on data from the EPA Safe Drinking Water Information System and the US Census American Community Survey. This address received a lead pipe risk score of ${score} out of 100, classified as ${riskLevel}.

The assessment identified the following contributing risk factors:

${factorLines}

The census tract serving this address (${censusTract || "N/A"}) has ${pre1986Str} of housing units built before 1986, the year the federal government banned new lead service line installations.

${isPregnant ? "The CDC states there is no safe level of lead exposure during pregnancy, as it can cause miscarriage, premature birth, and permanent harm to fetal brain development. The American College of Obstetricians and Gynecologists (ACOG) recommends blood lead testing for pregnant individuals with identified environmental risk factors, including residence in pre-1978 housing or areas with known lead pipe infrastructure." : "The CDC states there is no safe level of lead exposure in children. The American Academy of Pediatrics recommends blood lead testing for children with environmental risk factors including residence in pre-1978 housing or areas with known lead pipe infrastructure."}

I respectfully request that a blood lead level test be ordered at our next visit. I am happy to discuss this assessment further.

Sincerely,

${parentStr}

—————————————————————————————
Plumbum methodology and data sources: plumbummap.org/methodology
Plumbum arXiv preprint: arxiv.org/abs/plumbum`;
}

export default function PediatricianLetter({
  address,
  score,
  riskLevel,
  factors,
  censusTract,
  pctPre1986,
  isPregnant = false,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const [parentName, setParentName]         = useState("");
  const [childName, setChildName]           = useState("");
  const [childDob, setChildDob]             = useState("");
  const [pediatricianName, setPediatricianName] = useState("");
  const [letterText, setLetterText]         = useState("");
  const [copyState, setCopyState]           = useState<"idle" | "copied">("idle");
  const [downloading, setDownloading]       = useState(false);

  const rebuild = useCallback(() => {
    return buildLetterText(
      parentName, childName, childDob, pediatricianName,
      address, score, riskLevel, factors, censusTract, pctPre1986, today, isPregnant
    );
  }, [parentName, childName, childDob, pediatricianName, address, score, riskLevel, factors, censusTract, pctPre1986, today, isPregnant]);

  useEffect(() => {
    setLetterText(rebuild());
  }, [rebuild]);

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
      const data: PediatricianLetterData = {
        parentName, childName, childDob, pediatricianName,
        address, score, riskLevel, factors, censusTract, pctPre1986, isPregnant,
      };
      await generatePediatricianLetter(data);
    } catch (err) {
      console.error("Pediatrician letter PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Section meta label */}
        <div className={styles.sectionMeta}>MEDICAL TOOLS</div>
        <h2 className={styles.heading}>{isPregnant ? "Request a blood lead test for your pregnancy." : "Request a blood lead test for your child."}</h2>
        <p className={styles.body}>
          {isPregnant ? "Obstetricians" : "Pediatricians"} are more likely to order blood lead level tests when {isPregnant ? "patients" : "parents"} arrive with
          documented environmental risk data. We've written the letter for you.
        </p>

        {/* Input form */}
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="ped-parent-name">
              {isPregnant ? "Your Name (Patient)" : "Your Name (Parent / Guardian)"}
            </label>
            <input
              id="ped-parent-name"
              type="text"
              className={styles.input}
              placeholder="Jane Smith"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
            />
          </div>
          {!isPregnant && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="ped-child-name">
                  Child's Name
                </label>
                <input
                  id="ped-child-name"
                  type="text"
                  className={styles.input}
                  placeholder="Alex Smith"
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="ped-child-dob">
                  Child's Date of Birth
                </label>
                <input
                  id="ped-child-dob"
                  type="text"
                  className={styles.input}
                  placeholder="March 12, 2020"
                  value={childDob}
                  onChange={e => setChildDob(e.target.value)}
                />
              </div>
            </>
          )}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="ped-doctor-name">
              {isPregnant ? "OB/GYN's Name" : "Pediatrician's Name"} <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="ped-doctor-name"
              type="text"
              className={styles.input}
              placeholder="Dr. Maria Nguyen"
              value={pediatricianName}
              onChange={e => setPediatricianName(e.target.value)}
            />
          </div>
        </div>

        {/* CDC context note */}
        <p className={styles.cdcNote}>
          The CDC blood lead reference value is 3.5 micrograms per deciliter. There is no safe
          level of lead in children's blood.
        </p>

        {/* Letter preview */}
        <textarea
          className={styles.letterBox}
          value={letterText}
          onChange={e => setLetterText(e.target.value)}
          rows={30}
          spellCheck={false}
          aria-label="Pediatrician letter preview — editable"
        />

        {/* Action buttons */}
        <div className={styles.buttonRow}>
          <button
            id="ped-copy-btn"
            className={styles.copyBtn}
            onClick={handleCopy}
            type="button"
          >
            {copyState === "copied" ? "✓ Copied" : "Copy Letter"}
          </button>
          <button
            id="ped-download-btn"
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading}
            type="button"
          >
            {downloading ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>

        {/* Finder link */}
        <div className={styles.findDoctorRow}>
          <a
            href={isPregnant ? "https://www.acog.org/womens-health/find-an-ob-gyn" : "https://www.healthychildren.org/English/tips-tools/find-pediatrician/Pages/Pediatrician-Referral-Service.aspx"}
            target="_blank"
            rel="noreferrer"
            className={styles.findDoctorLink}
            id="ped-find-doctor-link"
          >
            {isPregnant ? "Find an OB/GYN →" : "Find a pediatrician →"}
          </a>
          <span className={styles.findDoctorNote}>
            {isPregnant ? "Official ACOG provider finder" : "Official AAP pediatrician finder"}
          </span>
        </div>

        {/* Legal disclaimer */}
        <p className={styles.disclaimer}>
          This letter was generated by Plumbum, an open-source civic research tool. It is not a
          medical diagnosis. Consult your healthcare provider.
        </p>
      </div>
    </section>
  );
}
