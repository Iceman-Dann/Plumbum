import { useQuery } from "@tanstack/react-query";
import styles from "../styles/data.module.css";

interface Stats {
  total_tests: number;
  tracts_covered: number;
  avg_ppb: number | null;
  pct_above_action: number | null;
  no_db?: boolean;
}

const CITATION = `Plumbum Community Water Test Dataset (2024–present).
Crowdsourced anonymous water test results aggregated by census tract.
Retrieved from https://plumbum.io/data
Dataset DOI: [pending arXiv submission]
License: CC BY 4.0`;

const SCHEMA_FIELDS = [
  { field: "fips", type: "varchar(11)", desc: "Census tract FIPS code (state + county + tract)" },
  { field: "test_date", type: "date", desc: "Date the test was conducted" },
  { field: "lead_ppb", type: "float", desc: "Lead concentration in parts per billion (µg/L)" },
  { field: "test_kit_brand", type: "varchar", desc: "Test kit or lab name (optional, may be blank)" },
  { field: "result_category", type: "varchar", desc: "SAFE / ELEVATED / ACTION_REQUIRED per EPA thresholds" },
  { field: "submitted_at", type: "timestamp", desc: "UTC timestamp when result was submitted" },
];

export default function Data() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["test-results-stats"],
    queryFn: async () => {
      const res = await fetch("/api/test-results/stats");
      return res.json() as Promise<Stats>;
    },
  });

  const totalTests = stats?.total_tests ?? 0;
  const tractsCovered = stats?.tracts_covered ?? 0;
  const avgPpb = stats?.avg_ppb;
  const pctAction = stats?.pct_above_action ?? 0;

  return (
    <div className={styles.wrapper}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroLabel}>RESEARCH DATASET</div>
        <h1 className={styles.heroHeadline}>
          A crowdsourced ground-truth dataset for lead in drinking water
        </h1>
        <p className={styles.heroBody}>
          Every water test result submitted through Plumbum becomes part of an anonymized,
          publicly downloadable research dataset — organized by census tract, timestamped,
          and released under CC BY 4.0. This is the data you cite in your paper.
        </p>
        <p className={styles.heroCite}>
          No names. No addresses. No personal data. Only water chemistry, location (tract-level), and time.
        </p>
      </section>

      {/* ── Stats grid ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statNum}>
              {isLoading ? "—" : totalTests.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Tests submitted</div>
            <div className={styles.statSub}>All time</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>
              {isLoading ? "—" : tractsCovered.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Census tracts covered</div>
            <div className={styles.statSub}>Unique geographies</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>
              {isLoading ? "—" : avgPpb != null ? `${avgPpb}` : "—"}
            </div>
            <div className={styles.statLabel}>Avg lead concentration</div>
            <div className={styles.statSub}>Parts per billion (µg/L)</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} style={{ color: pctAction > 0 ? "#C07A2A" : "#F4EFE8" }}>
              {isLoading ? "—" : `${pctAction}%`}
            </div>
            <div className={styles.statLabel}>Above EPA action level</div>
            <div className={styles.statSub}>≥15 ppb threshold</div>
          </div>
        </div>
      </section>

      {/* ── Download ── */}
      <section className={styles.downloadSection}>
        <div className={styles.downloadInner}>
          <div className={styles.sectionMeta}>DOWNLOAD</div>
          <h2 className={styles.sectionHeadline}>Full anonymized dataset</h2>
          <p className={styles.sectionBody}>
            The complete dataset is available as a single CSV file. Contains every submitted test
            result with census tract FIPS, date, lead concentration, test kit brand (where provided),
            and result category. No session IDs, no addresses, no personal data of any kind.
            Updated in real time.
          </p>
          <a href="/api/test-results/download" className={styles.downloadBtn} download>
            ↓ Download full CSV
          </a>
        </div>
      </section>

      {/* ── Citation ── */}
      <section className={styles.citeSection}>
        <div className={styles.citeInner}>
          <div className={styles.sectionMeta}>HOW TO CITE</div>
          <h2 className={styles.sectionHeadline}>Citation</h2>
          <div className={styles.citeBox}>{CITATION}</div>
          <p className={styles.citeNote}>
            If you publish findings using this dataset, we ask that you share your paper with us so we
            can link to it from this page. Contact: research@plumbum.io
          </p>
        </div>
      </section>

      {/* ── Schema ── */}
      <section className={styles.schemaSection}>
        <div className={styles.schemaInner}>
          <div className={styles.sectionMeta}>DATA DICTIONARY</div>
          <h2 className={styles.sectionHeadline}>CSV field definitions</h2>
          <table className={styles.fieldTable}>
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {SCHEMA_FIELDS.map(f => (
                <tr key={f.field}>
                  <td>{f.field}</td>
                  <td style={{ color: "#7A6F65" }}>{f.type}</td>
                  <td style={{ color: "#7A6F65" }}>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
