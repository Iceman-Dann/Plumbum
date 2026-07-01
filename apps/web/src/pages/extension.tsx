import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/extension.module.css";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IconBolt = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", strokeWidth: 2.2 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconLock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", strokeWidth: 2.2 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", strokeWidth: 2.2 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconGlobe = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", strokeWidth: 2.2 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconChart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", strokeWidth: 2.2 }}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconGit = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent)", strokeWidth: 2.2 }}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

// ── Page Component ────────────────────────────────────────────────────────────

export default function ExtensionPage() {
  const { t, lang } = useTranslation();

  return (
    <div className={styles.wrapper}>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>{t.extensionPage.heroBadge}</div>
          <h1 className={styles.heroTitle}>
            {lang === "es" ? (
              <>Puntuaciones de riesgo de plomo,<br />directamente en Zillow.</>
            ) : (
              <>Lead risk scores,<br />right on Zillow.</>
            )}
          </h1>
          <p className={styles.heroSub}>
            {t.extensionPage.heroSub}
          </p>
          <div className={styles.heroCtas}>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noreferrer"
              className={styles.ctaChrome}
              id="chrome-install-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
              {t.extensionPage.addChrome}
            </a>
            <a
              href="https://addons.mozilla.org"
              target="_blank"
              rel="noreferrer"
              className={styles.ctaFirefox}
              id="firefox-install-btn"
            >
              {t.extensionPage.addFirefox}
            </a>
          </div>
          <div className={styles.heroNote}>
            {t.extensionPage.heroNote}
          </div>
        </div>

        {/* Large Extension Popup Screenshot Preview */}
        <div className={styles.heroPreview}>
          <div className={styles.screenshotCardLarge}>
            <img src="/extension-screenshot.png" alt="Plumbum Extension Popup" className={styles.screenshotImg} />
          </div>
          <div className={styles.previewCaption}>
            {lang === "es" 
              ? "Desglose completo de la extensión en tiempo real." 
              : "Full real-time extension popup breakdown."}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className={styles.sectionLabel}>{t.extensionPage.howWorksLabel}</div>
        <h2 className={styles.sectionTitle}>{t.extensionPage.howWorksTitle}</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepTitle}>{t.extensionPage.step1Title}</div>
            <div className={styles.stepBody}>
              {t.extensionPage.step1Body}
            </div>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepTitle}>{t.extensionPage.step2Title}</div>
            <div className={styles.stepBody}>
              {t.extensionPage.step2Body}
            </div>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepTitle}>{t.extensionPage.step3Title}</div>
            <div className={styles.stepBody}>
              {t.extensionPage.step3Body}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconBolt /></div>
            <h3 className={styles.featureTitle}>{t.extensionPage.feature1Title}</h3>
            <p className={styles.featureBody}>{t.extensionPage.feature1Body}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconLock /></div>
            <h3 className={styles.featureTitle}>{t.extensionPage.feature2Title}</h3>
            <p className={styles.featureBody}>{t.extensionPage.feature2Body}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconAlert /></div>
            <h3 className={styles.featureTitle}>{t.extensionPage.feature3Title}</h3>
            <p className={styles.featureBody}>{t.extensionPage.feature3Body}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconGlobe /></div>
            <h3 className={styles.featureTitle}>{t.extensionPage.feature4Title}</h3>
            <p className={styles.featureBody}>{t.extensionPage.feature4Body}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconChart /></div>
            <h3 className={styles.featureTitle}>{t.extensionPage.feature5Title}</h3>
            <p className={styles.featureBody}>{t.extensionPage.feature5Body}</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconGit /></div>
            <h3 className={styles.featureTitle}>{t.extensionPage.feature6Title}</h3>
            <p className={styles.featureBody}>{t.extensionPage.feature6Body}</p>
          </div>
        </div>
      </section>

      {/* ── Supported sites ─────────────────────────────────────── */}
      <section className={styles.sitesSection}>
        <div className={styles.sectionLabel}>{t.extensionPage.worksOnLabel}</div>
        <h2 className={styles.sectionTitle}>{t.extensionPage.worksOnTitle}</h2>
        <div className={styles.sitesList}>
          {["Zillow", "Redfin", "Trulia", "Realtor.com", "Apartments.com"].map(site => (
            <div key={site} className={styles.siteChip}>{site}</div>
          ))}
        </div>
      </section>

      {/* ── Developer download ───────────────────────────────────── */}
      <section className={styles.devSection}>
        <div className={styles.devInner}>
          <div className={styles.devLeft}>
            <div className={styles.sectionLabel}>{t.extensionPage.devLabel}</div>
            <h2 className={styles.devTitle}>{t.extensionPage.devTitle}</h2>
            <p className={styles.devBody}>
              {t.extensionPage.devBody}
            </p>
            <ol className={styles.devSteps}>
              <li>{t.extensionPage.devStep1}</li>
              <li>{t.extensionPage.devStep2}</li>
              <li>{t.extensionPage.devStep3}</li>
              <li>{t.extensionPage.devStep4}</li>
            </ol>
            <a
              href="/extension.zip"
              className={styles.devDownload}
              download
              id="extension-zip-download"
            >
              {t.extensionPage.devDownloadBtn}
            </a>
          </div>
          <div className={styles.devRight}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>{lang === "es" ? "Estructura de la extensión" : "Extension structure"}</div>
              <pre className={styles.code}>{`extension/
  manifest.json     ← Chrome MV3
  content.js        ← Badge injection
  background.js     ← Service worker
  popup.html/js/css ← Toolbar popup
  icons/
    icon16.png
    icon48.png
    icon128.png`}</pre>
            </div>
          </div>
        </div>
      </section>



    </div>
  );
}
