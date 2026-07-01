import styles from "./ZillowListingDemo.module.css";
import { useTranslation } from "@/hooks/useTranslation";

/** 
 * Mock Chrome Extension Popup representing the real Plumbum browser extension.
 * Replicated exactly to match the user's uploaded mockup:
 * - Header: Logo, Title, Gear icon.
 * - Subheader: 23 EDWIN PL, NEWARK, NJ, 07112.
 * - Score: 45 / 100 MODERATE.
 * - Table of Risk Factors: Pre-1986 Construction (12/25), EPA Violation History (5/25),
 *   Economic Investment Risk (10/25), Regional Risk Profile (18/25).
 * - CTA Button: View Full Report →.
 * - Footer: plumbummap.org · Methodology.
 */
export default function ZillowListingDemo() {
  const { t } = useTranslation();
  return (
    <div className={styles.extWrapper} role="img" aria-label="Plumbum Browser Extension popup mockup">
      {/* Header bar */}
      <div className={styles.extHeader}>
        <div className={styles.logoGroup}>
          <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <span className={styles.logoText}>Plumbum</span>
        </div>
        <button type="button" className={styles.settingsBtn} aria-label="Settings">
          <svg className={styles.settingsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Main card body */}
      <div className={styles.extBody}>
        {/* Address */}
        <div className={styles.addressLine}>23 EDWIN PL, NEWARK, NJ, 07112</div>

        {/* Score block */}
        <div className={styles.scoreRow}>
          <div className={styles.scoreValue}>45</div>
          <div className={styles.scoreLevelGroup}>
            <span className={styles.scoreLevel}>{t.riskLevels.moderate.toUpperCase()}</span>
            <span className={styles.scoreOf}>/ 100</span>
          </div>
        </div>

        {/* Risk factors table */}
        <div className={styles.factorsSection}>
          <div className={styles.factorsHeader}>{t.result.riskFactors.toUpperCase()}</div>
          <div className={styles.factorsList}>
            <div className={styles.factorRow}>
              <span className={styles.factorName}>{t.riskFactors.pre1986}</span>
              <span className={`${styles.factorWeight} ${styles.weightOrange}`}>12/25</span>
            </div>
            <div className={styles.factorRow}>
              <span className={styles.factorName}>{t.riskFactors.epaViolations}</span>
              <span className={`${styles.factorWeight} ${styles.weightGreen}`}>5/25</span>
            </div>
            <div className={styles.factorRow}>
              <span className={styles.factorName}>{t.riskFactors.economicRisk}</span>
              <span className={`${styles.factorWeight} ${styles.weightOrange}`}>10/25</span>
            </div>
            <div className={styles.factorRow}>
              <span className={styles.factorName}>{t.riskFactors.regionalRisk}</span>
              <span className={`${styles.factorWeight} ${styles.weightRed}`}>18/25</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button type="button" className={styles.ctaButton}>
          {t.resultCard.viewFullReport}
        </button>
      </div>

      {/* Footer */}
      <div className={styles.extFooter}>
        <span>plumbummap.org</span>
        <span className={styles.footerDot}>·</span>
        <span>{t.footer.methodology}</span>
      </div>
    </div>
  );
}
