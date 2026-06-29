import React, { useState } from "react";
import styles from "../styles/pediatricianLetter.module.css";

interface Props {
  address: string;
  pwsName: string;
}

export default function FreeFilterDemand({ address, pwsName }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cleanPws = pwsName || "Local Water Utility";
  const defaultLetter = `Date: ${today}
To: Public Water System Administrator / Customer Service Manager
Water Utility: ${cleanPws}

RE: REQUEST FOR MANDATED POINT-OF-USE (POU) WATER FILTRATION DEVICE
ADDRESS: ${address}

To Whom It May Concern,

I am writing to formally demand the immediate delivery of a free NSF-53 certified water filtration pitcher and a six-month supply of replacement cartridges to my residence at the address listed above.

According to a lead contamination risk assessment conducted for my property, the water service line serving this address has a high predictive risk of lead content.

Under the EPA’s recently enacted Lead and Copper Rule Improvements (LCRI) mandate, public water systems (PWS) are federally required to distribute Point-of-Use (POU) filtration devices to residents whose homes are served by known or highly suspected lead service lines, galvanized lines requiring replacement, or systems with lead action level exceedances.

Citing the EPA LCRI mandate for Point-of-Use (POU) filters for high-risk service lines, I expect immediate fulfillment of this requirement. Please confirm receipt of this demand and provide a tracking number for the delivery of the NSF-53 filtration device and six months of cartridges within five (5) business days.

Sincerely,

Resident of ${address}`;

  const [letterText, setLetterText] = useState(defaultLetter);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionMeta}>EPA COMPLIANCE</div>
        <h2 className={styles.heading}>Claim Free Mandated Filter</h2>
        
        <p className={styles.body} style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#1A1614", fontWeight: 500, borderLeft: "4px solid #a63d2f", paddingLeft: "16px", marginBottom: "24px" }}>
          Under the EPA Lead and Copper Rule Improvements (LCRI), your utility may be federally required to provide you with a free NSF-53 certified water filter and six months of cartridges.
        </p>

        <textarea
          style={{
            width: "100%",
            height: "360px",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.6",
            padding: "16px",
            border: "1.5px solid var(--color-border)",
            backgroundColor: "#FAF9F6",
            outline: "none",
            borderRadius: "4px",
            marginBottom: "16px",
            resize: "vertical",
          }}
          value={letterText}
          onChange={(e) => setLetterText(e.target.value)}
          aria-label="EPA free filter demand letter"
          spellCheck={false}
        />

        <div style={{ display: "flex", gap: "16px" }}>
          <button
            type="button"
            style={{
              backgroundColor: "#a63d2f",
              color: "#FFFFFF",
              border: "none",
              padding: "12px 24px",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
            onClick={handleCopy}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {copyState === "copied" ? "✓ Copied!" : "Copy Legal Demand"}
          </button>
        </div>
      </div>
    </section>
  );
}
