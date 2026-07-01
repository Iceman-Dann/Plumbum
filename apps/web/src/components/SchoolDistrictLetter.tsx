import React, { useState, useEffect, useCallback } from "react";
import styles from "../styles/pediatricianLetter.module.css";

interface Factor {
  name: string;
  detail: string;
  score: number;
  max: number;
}

interface Props {
  address: string;
  schoolName: string;
  score: number;
  riskLevel: string;
  factors: Factor[];
  censusTract: string;
}

function buildLetterText(
  senderName: string,
  districtOfficialName: string,
  address: string,
  schoolName: string,
  score: number,
  riskLevel: string,
  factors: Factor[],
  censusTract: string,
  today: string,
): string {
  const salutation = districtOfficialName.trim()
    ? `Dear ${districtOfficialName.trim()},`
    : "Dear School District Facilities Director / Superintendent,";
  const senderStr = senderName.trim() || "[your name]";

  const factorLines = factors
    .map(f => `  · ${f.name} (${f.score}/${f.max}): ${f.detail}`)
    .join("\n");

  return `${today}

${salutation}

FORMAL REQUEST: LEAD IN DRINKING WATER — ${(schoolName || "THIS SCHOOL").toUpperCase()}

I am writing as a parent/community member to formally request immediate action regarding the lead-in-drinking-water risk at ${schoolName || address}.

A risk analysis conducted by Plumbum (plumbummap.org) — an open-source public health tool built on EPA Safe Drinking Water Information System and US Census data — shows that this facility's address received a lead pipe risk score of ${score} out of 100, classified as ${riskLevel.toUpperCase()} RISK.

The assessment identified the following contributing risk factors:

${factorLines}

Under the EPA's 3Ts (Training, Testing, and Taking Action) framework and the Safe Drinking Water Act, school districts have a responsibility to ensure children are not exposed to unsafe lead levels in drinking water. The EPA recommends that all schools and child care facilities conduct routine lead testing and take immediate action when lead is detected at or above 10 parts per billion (ppb).

I formally request that the District:

1. Provide the most recent lead water test results for all drinking water outlets at ${schoolName || "this school"}, including date of testing and which outlets, if any, exceeded 10 ppb.
2. If testing has not been conducted within the last 12 months, schedule testing immediately and share results with parents and staff within 30 days of receipt.
3. Provide a written summary of any lead remediation actions taken at this facility (pipe replacements, filter installations, outlet shutdowns, etc.) and timelines for any pending work.
4. Where fixtures or service lines are known or suspected to contain lead, immediately provide certified NSF-53 filtration at all drinking outlets accessible to students and staff pending full remediation.

This request is made under [STATE] open records law. Please respond in writing within 10 business days confirming how the District intends to address these items.

Sincerely,

${senderStr}

—————————————————————————————
Plumbum Schools Risk Tool: plumbummap.org/schools
EPA 3Ts for Schools: epa.gov/ground-water-and-drinking-water/3ts-reducing-lead-drinking-water-schools-and-child-care-facilities`;
}

export default function SchoolDistrictLetter({
  address,
  schoolName,
  score,
  riskLevel,
  factors,
  censusTract,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const [senderName, setSenderName] = useState("");
  const [officialName, setOfficialName] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const rebuild = useCallback(() => {
    return buildLetterText(
      senderName, officialName, address, schoolName, score, riskLevel, factors, censusTract, today
    );
  }, [senderName, officialName, address, schoolName, score, riskLevel, factors, censusTract, today]);

  useEffect(() => {
    setLetterText(rebuild());
  }, [rebuild]);

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionMeta}>FORMAL DISTRICT REQUEST</div>
        <h2 className={styles.heading}>Notify School District / Facilities</h2>
        <p className={styles.body}>
          As a parent or community member, you have standing to formally request lead testing records, remediation history, and filtration installation from your school district's Facilities Director or Superintendent. This letter invokes the EPA's 3Ts framework and your state's open records law.
        </p>

        {/* Input form */}
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="sd-sender-name">
              Your Name
            </label>
            <input
              id="sd-sender-name"
              type="text"
              className={styles.input}
              placeholder="Jane Smith"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="sd-official-name">
              Facilities Director / Superintendent Name (optional)
            </label>
            <input
              id="sd-official-name"
              type="text"
              className={styles.input}
              placeholder="Dr. John Doe, Superintendent"
              value={officialName}
              onChange={e => setOfficialName(e.target.value)}
            />
          </div>
        </div>

        {/* Letter preview */}
        <textarea
          className={styles.letterBox}
          value={letterText}
          onChange={e => setLetterText(e.target.value)}
          rows={32}
          spellCheck={false}
          aria-label="School district letter preview — editable"
        />

        {/* Action buttons */}
        <div className={styles.buttonRow}>
          <button
            id="sd-copy-btn"
            className={styles.copyBtn}
            onClick={handleCopy}
            type="button"
          >
            {copyState === "copied" ? "✓ Copied" : "Copy Letter"}
          </button>
        </div>

        <p className={styles.disclaimer}>
          Replace [STATE] with your state name before sending. This letter is an open-source advocacy tool, not legal counsel. Consider consulting your school's PTA or a local legal aid organization for additional support.
        </p>
      </div>
    </section>
  );
}
