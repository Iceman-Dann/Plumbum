import React, { useState, useEffect, useCallback } from "react";
import { generateLandlordLetter } from "../lib/generateLandlordLetter";
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
}

function buildLetterText(
  tenantName: string,
  landlordName: string,
  address: string,
  score: number,
  riskLevel: string,
  factors: Factor[],
  censusTract: string,
  today: string,
): string {
  const salutation = landlordName.trim()
    ? `Dear ${landlordName.trim()},`
    : "Dear Landlord / Property Manager,";
  const tenantStr = tenantName.trim() || "[your name]";

  const factorLines = factors
    .map(f => `  · ${f.name} (${f.score}/${f.max}): ${f.detail}`)
    .join("\n");

  return `${today}

${salutation}

FORMAL LEGAL NOTICE: IMPAIRMENT OF POTABLE WATER & IMPLIED WARRANTY OF HABITABILITY

I am writing as the tenant of ${address} to formally notify you that the drinking water at this property is at severe risk of toxic lead contamination.

According to a risk analysis conducted by Plumbum (plumbummap.org), this address received a lead pipe risk score of ${score} out of 100, which is classified as a ${riskLevel.toUpperCase()} RISK profile.

The assessment identified the following contributing risk factors:

${factorLines}

Under municipal and state landlord-tenant laws, you have a strict, non-waivable legal duty to maintain the property in a state fit for human habitation, which includes providing continuous access to safe, potable drinking water. Toxic lead in drinking water constitutes a material breach of the Implied Warranty of Habitability.

I hereby demand that you take the following corrective actions immediately:
1. Immediately provide a continuous supply of bottled drinking water or install an NSF-53 certified water filter designed to remove lead.
2. Within 14 days of this notice, perform a physical inspection (scratch test) of the service line or order a certified laboratory tap water test to confirm the presence of lead, and provide me with the results.
3. If lead service lines are present, outline your plan and timeline to replace them.

If you fail to provide a safe water supply or fail to address this material breach within the legally prescribed cure period, I will exercise my statutory tenant rights. This includes, but is not limited to, withholding my rent payments and depositing them into a separate escrow account, or hiring a licensed plumber to inspect/verify and deducting the cost directly from my rent.

Please respond in writing within 48 hours to confirm how you intend to remedy this condition.

Sincerely,

${tenantStr}

—————————————————————————————
Plumbum Landlord Accountability Portal: plumbummap.org/accountability`;
}

export default function LandlordLetter({
  address,
  score,
  riskLevel,
  factors,
  censusTract,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const [tenantName, setTenantName] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [letterText, setLetterText] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [downloading, setDownloading] = useState(false);

  const rebuild = useCallback(() => {
    return buildLetterText(
      tenantName, landlordName, address, score, riskLevel, factors, censusTract, today
    );
  }, [tenantName, landlordName, address, score, riskLevel, factors, censusTract, today]);

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
      await generateLandlordLetter({
        tenantName,
        landlordName,
        address,
        score,
        riskLevel,
        factors,
        censusTract,
      });
    } catch (err) {
      console.error("Landlord letter PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionMeta}>TENANT LEGAL ACTION</div>
        <h2 className={styles.heading}>The Habitability Demand</h2>
        <p className={styles.body}>
          Landlords are legally required to provide safe, potable water. If your rental has a high lead risk, use this formal demand to assert your right to clean water and threaten rent-escrow withholding.
        </p>

        {/* Input form */}
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="ll-tenant-name">
              Your Name (Tenant)
            </label>
            <input
              id="ll-tenant-name"
              type="text"
              className={styles.input}
              placeholder="Jane Smith"
              value={tenantName}
              onChange={e => setTenantName(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="ll-landlord-name">
              Landlord or Management Co. Name
            </label>
            <input
              id="ll-landlord-name"
              type="text"
              className={styles.input}
              placeholder="John Doe Properties, LLC"
              value={landlordName}
              onChange={e => setLandlordName(e.target.value)}
            />
          </div>
        </div>

        {/* Letter preview */}
        <textarea
          className={styles.letterBox}
          value={letterText}
          onChange={e => setLetterText(e.target.value)}
          rows={30}
          spellCheck={false}
          aria-label="Landlord letter preview — editable"
        />

        {/* Action buttons */}
        <div className={styles.buttonRow}>
          <button
            id="ll-copy-btn"
            className={styles.copyBtn}
            onClick={handleCopy}
            type="button"
          >
            {copyState === "copied" ? "✓ Copied" : "Copy Email / Letter"}
          </button>
          <button
            id="ll-download-btn"
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloading}
            type="button"
          >
            {downloading ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>

        <p className={styles.disclaimer}>
          This letter is generated as an open-source tool. It is not legal counsel. Seek legal aid or check HUD guides for state-specific renter protections.
        </p>
      </div>
    </section>
  );
}
