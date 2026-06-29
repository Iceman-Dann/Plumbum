import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/data.module.css";

interface Stats {
  total_tests: number;
  tracts_covered: number;
  avg_ppb: number | null;
  pct_above_action: number | null;
  no_db?: boolean;
}

export default function Data() {
  const { t } = useTranslation();
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
      <section className={styles.hero}>
        <div className={styles.heroLabel}>{t.data.heroLabel}</div>
        <h1 className={styles.heroHeadline}>{t.data.headline}</h1>
        <p className={styles.heroBody}>{t.data.heroBody}</p>
        <p className={styles.heroCite}>{t.data.heroCite}</p>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{isLoading ? "—" : totalTests.toLocaleString()}</div>
            <div className={styles.statLabel}>{t.data.testsSubmitted}</div>
            <div className={styles.statSub}>{t.data.allTime}</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{isLoading ? "—" : tractsCovered.toLocaleString()}</div>
            <div className={styles.statLabel}>{t.data.tractsCovered}</div>
            <div className={styles.statSub}>{t.data.uniqueGeographies}</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{isLoading ? "—" : avgPpb != null ? `${avgPpb}` : "—"}</div>
            <div className={styles.statLabel}>{t.data.avgLead}</div>
            <div className={styles.statSub}>{t.data.ppbUnit}</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} style={{ color: pctAction > 0 ? "#C07A2A" : "#F4EFE8" }}>
              {isLoading ? "—" : `${pctAction}%`}
            </div>
            <div className={styles.statLabel}>{t.data.aboveAction}</div>
            <div className={styles.statSub}>{t.data.actionThreshold}</div>
          </div>
        </div>
      </section>

      <section className={styles.downloadSection}>
        <div className={styles.downloadInner}>
          <div className={styles.sectionMeta}>{t.data.downloadMeta}</div>
          <h2 className={styles.sectionHeadline}>{t.data.downloadHeadline}</h2>
          <p className={styles.sectionBody}>{t.data.downloadBody}</p>
          <a href="/api/test-results/download" className={styles.downloadBtn} download>
            {t.data.downloadBtn}
          </a>
        </div>
      </section>

      <section className={styles.citeSection}>
        <div className={styles.citeInner}>
          <div className={styles.sectionMeta}>{t.data.citeMeta}</div>
          <h2 className={styles.sectionHeadline}>{t.data.citeHeadline}</h2>
          <div className={styles.citeBox}>{t.data.citation}</div>
          <p className={styles.citeNote}>{t.data.citeNote}</p>
        </div>
      </section>

      <section className={styles.schemaSection}>
        <div className={styles.schemaInner}>
          <div className={styles.sectionMeta}>{t.data.schemaMeta}</div>
          <h2 className={styles.sectionHeadline}>{t.data.schemaHeadline}</h2>
          <table className={styles.fieldTable}>
            <thead>
              <tr>
                <th>{t.data.colField}</th>
                <th>{t.data.colType}</th>
                <th>{t.data.colDescription}</th>
              </tr>
            </thead>
            <tbody>
              {t.data.schemaFields.map(f => (
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
