import styles from "../styles/extension.module.css";

export default function ExtensionPage() {
  return (
    <div className={styles.wrapper}>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>FREE EXTENSION</div>
          <h1 className={styles.heroTitle}>
            Lead risk scores,<br />
            right on Zillow.
          </h1>
          <p className={styles.heroSub}>
            The Plumbum extension automatically shows EPA-backed lead pipe risk badges on every real estate listing — Zillow, Redfin, Trulia, Realtor.com, and Apartments.com — without leaving the page.
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
              Add to Chrome — Free
            </a>
            <a
              href="https://addons.mozilla.org"
              target="_blank"
              rel="noreferrer"
              className={styles.ctaFirefox}
              id="firefox-install-btn"
            >
              Add to Firefox
            </a>
          </div>
          <div className={styles.heroNote}>
            Supports Chrome, Edge, and Firefox · No account required · Open source
          </div>
        </div>

        {/* Badge mockup preview */}
        <div className={styles.heroPreview}>
          <div className={styles.previewCard}>
            <div className={styles.previewPhoto}>
              <div className={styles.previewPhotoGradient} />
              <div className={styles.previewAddress}>123 Oak Street, Chicago, IL 60601</div>
              <div className={styles.previewPrice}>$425,000</div>
            </div>
            {/* Badge */}
            <div className={styles.previewBadge}>
              <div className={styles.previewBadgePb}>Pb</div>
              <div className={styles.previewBadgeDivider} />
              <div className={styles.previewBadgeRight}>
                <div className={styles.previewBadgeScore}>78</div>
                <div className={styles.previewBadgeLevel}>HIGH RISK</div>
              </div>
            </div>
            {/* Pulse ring */}
            <div className={styles.previewBadgePulse} />
          </div>
          <div className={styles.previewCaption}>Badge appears automatically on listing pages</div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className={styles.sectionLabel}>HOW IT WORKS</div>
        <h2 className={styles.sectionTitle}>Three seconds to know the risk.</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepTitle}>Install the extension</div>
            <div className={styles.stepBody}>
              Add Plumbum to Chrome or Firefox with one click — no account, no sign-up required.
            </div>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepTitle}>Browse listings normally</div>
            <div className={styles.stepBody}>
              Visit Zillow, Redfin, Trulia, Realtor.com, or Apartments.com as you normally would.
            </div>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepTitle}>See the risk badge</div>
            <div className={styles.stepBody}>
              A badge appears instantly on every listing with the lead risk score and full factor breakdown.
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3 className={styles.featureTitle}>Instant — no extra steps</h3>
            <p className={styles.featureBody}>The badge appears automatically as you browse. No copy-pasting addresses, no switching tabs.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3 className={styles.featureTitle}>Private & offline-capable</h3>
            <p className={styles.featureBody}>Results are cached locally for 24 hours. The same listing never makes two API calls.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🤰</div>
            <h3 className={styles.featureTitle}>Pregnancy mode</h3>
            <p className={styles.featureBody}>Enable a special mode for elevated urgency messaging and prenatal health guidance on every listing.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🌍</div>
            <h3 className={styles.featureTitle}>English & Spanish</h3>
            <p className={styles.featureBody}>All badge and popup text available in both English and Spanish via the settings toggle.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>Full factor breakdown</h3>
            <p className={styles.featureBody}>Click the badge to see all four scoring factors: housing age, EPA violations, income, and regional risk.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🆓</div>
            <h3 className={styles.featureTitle}>Free & open source</h3>
            <p className={styles.featureBody}>No subscription. No tracking. Built on public EPA and Census data. Source code available on GitHub.</p>
          </div>
        </div>
      </section>

      {/* ── Supported sites ─────────────────────────────────────── */}
      <section className={styles.sitesSection}>
        <div className={styles.sectionLabel}>WORKS ON</div>
        <h2 className={styles.sectionTitle}>All the major real estate platforms.</h2>
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
            <div className={styles.sectionLabel}>FOR DEVELOPERS</div>
            <h2 className={styles.devTitle}>Load unpacked in 60 seconds.</h2>
            <p className={styles.devBody}>
              Download the extension source, unzip it, then load it as an unpacked extension in Chrome's developer mode. No build step required.
            </p>
            <ol className={styles.devSteps}>
              <li>Download and unzip the extension folder below</li>
              <li>Go to <code>chrome://extensions</code> and enable "Developer mode"</li>
              <li>Click "Load unpacked" and select the unzipped folder</li>
              <li>Visit any Zillow or Redfin listing to see the badge</li>
            </ol>
            <a
              href="/extension.zip"
              className={styles.devDownload}
              download
              id="extension-zip-download"
            >
              ↓ Download extension.zip
            </a>
          </div>
          <div className={styles.devRight}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>Extension structure</div>
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

      {/* ── Store listing copy ───────────────────────────────────── */}
      <section className={styles.storeSection}>
        <div className={styles.sectionLabel}>CHROME WEB STORE LISTING</div>
        <h2 className={styles.sectionTitle}>Submit to both stores.</h2>
        <div className={styles.storeCopy}>
          <div className={styles.storeField}>
            <div className={styles.storeFieldLabel}>Name</div>
            <div className={styles.storeFieldValue}>Plumbum — Lead Pipe Risk Scanner</div>
          </div>
          <div className={styles.storeField}>
            <div className={styles.storeFieldLabel}>Category</div>
            <div className={styles.storeFieldValue}>Productivity / Public Safety</div>
          </div>
          <div className={styles.storeField}>
            <div className={styles.storeFieldLabel}>Description</div>
            <div className={styles.storeFieldValue}>
              Automatically shows lead pipe risk scores on Zillow, Redfin, Trulia, and other real estate sites. Built on EPA and US Census data. Free and open source. From plumbum.io.
            </div>
          </div>
          <div className={styles.storeLinks}>
            <a
              href="https://chrome.google.com/webstore/developer/dashboard"
              target="_blank"
              rel="noreferrer"
              className={styles.storeLink}
            >
              Submit to Chrome Web Store →
            </a>
            <a
              href="https://addons.mozilla.org/developers/"
              target="_blank"
              rel="noreferrer"
              className={styles.storeLink}
            >
              Submit to Firefox Add-ons →
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
