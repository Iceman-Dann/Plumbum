import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/data.module.css";

interface Stats {
  total_tests: number;
  tracts_covered: number;
  avg_ppb: number | null;
  pct_above_action: number | null;
  no_db?: boolean;
}

interface RecentRow {
  fips: string;
  test_date: string;
  lead_ppb: number;
  result_category: string;
  submitted_at: string;
}

export default function Data() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const refreshData = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["test-results-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["test-results-recent"] }),
      ]);
    };

    const handleSubmission = () => {
      void refreshData();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "plumbum:test-submitted") {
        void refreshData();
      }
    };

    window.addEventListener("plumbum:test-submitted", handleSubmission);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("plumbum:test-submitted", handleSubmission);
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["test-results-stats"],
    queryFn: async () => {
      const res = await fetch("/api/test-results/stats");
      return res.json() as Promise<Stats>;
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const { data: recentData, isLoading: recentLoading } = useQuery<{ rows: RecentRow[] }>({
    queryKey: ["test-results-recent"],
    queryFn: async () => {
      const res = await fetch("/api/test-results/recent?limit=10");
      return res.json() as Promise<{ rows: RecentRow[] }>;
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const visibleTestCount = stats?.total_tests ?? 0;
  const downloadLabel = t.data.downloadBtn.replace("{count}", `${visibleTestCount}`);
  const tableRows = (recentData?.rows ?? []).map(row => ({
    fips: row.fips,
    testDate: row.test_date,
    leadPpb: row.lead_ppb?.toString() ?? "—",
    result: (row.result_category || "UNKNOWN")
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase()),
  }));

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
            <div className={styles.statLabel}>{t.data.currentStatusTitle}</div>
            <div className={styles.statNum}>
              {isLoading ? "—" : `${visibleTestCount} test result${visibleTestCount === 1 ? "" : "s"} submitted`}
            </div>
            <div className={styles.statSub}>
              {stats?.tracts_covered ? `${stats.tracts_covered} tracts covered` : t.data.currentStatusRange}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsInner}>
          <div className={styles.sectionMeta}>{t.data.sampleResultsMeta}</div>
          <h2 className={styles.sectionHeadline}>{t.data.sampleResultsHeadline}</h2>
          <p className={styles.sectionBody}>{t.data.sampleResultsIntro}</p>
          <div className={styles.tableWrap}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th>{t.data.sampleTableFips}</th>
                  <th>{t.data.sampleTableDate}</th>
                  <th>{t.data.sampleTableLead}</th>
                  <th>{t.data.sampleTableResult}</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No submitted test rows yet.</td>
                  </tr>
                ) : (
                  tableRows.map(row => (
                    <tr key={`${row.fips}-${row.testDate}`}>
                      <td>{row.fips}</td>
                      <td>{row.testDate}</td>
                      <td>{row.leadPpb}</td>
                      <td>{row.result}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={styles.downloadSection}>
        <div className={styles.downloadInner}>
          <div className={styles.sectionMeta}>{t.data.downloadMeta}</div>
          <h2 className={styles.sectionHeadline}>{t.data.downloadHeadline}</h2>
          <p className={styles.sectionBody}>{t.data.downloadBody}</p>
          <a href="/api/test-results/download" className={styles.downloadBtn} download>
            {downloadLabel}
          </a>
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
