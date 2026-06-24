import { mockResearchFindings } from "@/lib/mockData";
import styles from "../styles/research.module.css";

const ASSETS = [
  { title: "The Dataset", desc: "Full parcel-level predictions", size: "1.2GB CSV" },
  { title: "The Model Weights", desc: "Pre-trained PyTorch model", size: "45MB PT" },
  { title: "The Paper", desc: "Methodology preprint", size: "2.4MB PDF" },
  { title: "City-Level CSVs", desc: "Aggregated results by municipality", size: "18MB ZIP" },
  { title: "Methodology PDF", desc: "Print-ready whitepaper", size: "1.1MB PDF" },
  { title: "Raw EPA Data", desc: "Cleaned SDWIS exports", size: "400MB CSV" },
];

export default function Research() {
  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.headline}>The invisible crisis in America's water infrastructure</h1>
          <p className={styles.heroBody}>
            Everything reporters, policymakers, and researchers need to use Plumbum's data.
          </p>
        </div>
      </header>

      <section className={styles.assetsSection}>
        <div className={styles.container}>
          <div className={styles.assetsGrid}>
            {ASSETS.map((asset, i) => (
              <div key={i} className={styles.assetCard}>
                <h3 className={styles.assetTitle}>{asset.title}</h3>
                <p className={styles.assetDesc}>{asset.desc}</p>
                <div className={styles.assetMeta}>
                  <span className={styles.assetSize}>{asset.size}</span>
                  <a href="#" className={styles.assetLink}>Download ↗</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.findingsSection}>
        <div className={styles.findingsContainer}>
          {mockResearchFindings.map((finding, i) => (
            <div key={i} className={styles.findingRow}>
              <div className={styles.findingNum}>0{i + 1}</div>
              <div className={styles.findingContent}>
                <h2 className={styles.findingTitle}>{finding.title}</h2>
                <p className={styles.findingBody}>{finding.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className={styles.containerCenter}>
          <p className={styles.contactIntro}>For press inquiries and data requests, contact</p>
          <a href="mailto:press@plumbum.org" className={styles.contactEmail}>press@plumbum.org</a>
          <p className={styles.contactNote}>
            We can accommodate custom city-level data cuts for local newsrooms upon request.
          </p>
        </div>
      </section>
    </div>
  );
}
