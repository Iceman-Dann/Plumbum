import React, { Suspense, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { interpolate } from "@/lib/translations";
import styles from "../styles/hotspots.module.css";

const HotspotsMap = React.lazy(() => import("../components/map/hotspots-map"));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Hotspot {
  rank: number;
  fips: string;
  city: string;
  search_count: number;
  avg_score: number;
  lat: number;
  lng: number;
}

type SortKey = "rank" | "city" | "search_count" | "avg_score";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 65) return "#A63D2F";
  if (score >= 35) return "#C07A2A";
  return "#4A7C59";
}

function riskLabel(score: number, t: ReturnType<typeof useTranslation>["t"]): string {
  if (score >= 65) return t.riskLevels.high;
  if (score >= 35) return t.riskLevels.moderate;
  return t.riskLevels.low;
}

// ---------------------------------------------------------------------------
// Table header cell
// ---------------------------------------------------------------------------

function Th({
  label,
  col,
  active,
  dir,
  onClick,
}: {
  label: string;
  col: SortKey;
  active: SortKey;
  dir: SortDir;
  onClick: (c: SortKey) => void;
}) {
  const isActive = col === active;
  return (
    <th
      className={`${styles.th} ${isActive ? styles.thActive : ""}`}
      onClick={() => onClick(col)}
    >
      {label}
      <span className={styles.sortIcon}>
        {isActive ? (dir === "asc" ? " ↑" : " ↓") : " ↕"}
      </span>
    </th>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Hotspots() {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [country, setCountry] = useState<"us" | "ca">("us");

  const { data, isLoading, error } = useQuery<{ hotspots: Hotspot[]; error?: string }, Error>({
    queryKey: ["hotspots", country],
    queryFn: async () => {
      const res = await fetch(`/api/hotspots?country=${country}`);
      return res.json() as Promise<{ hotspots: Hotspot[]; error?: string }>;
    },
    refetchInterval: 60_000, // refresh every minute
  });

  const hotspots = data?.hotspots ?? [];
  const noDb = !isLoading && data?.error?.includes("Database not configured");

  const sorted = useMemo(() => {
    const arr = [...hotspots];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "city") cmp = (a.city ?? "").localeCompare(b.city ?? "");
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [hotspots, sortKey, sortDir]);

  function handleSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(col);
      setSortDir(col === "rank" ? "asc" : "desc");
    }
  }

  return (
    <div className={styles.wrapper}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.liveLabel}>
          <span className={styles.liveDot} />
          {t.hotspots.liveData}
        </div>
        <h1 className={styles.headline}>{t.hotspots.headline}</h1>
        <p className={styles.subtext}>{t.hotspots.subtext}</p>
      </section>

      {/* ── Country Toggle ── */}
      <div className={styles.toggleSection}>
        <button
          className={`${styles.toggleBtn} ${country === "us" ? styles.toggleBtnActive : ""}`}
          onClick={() => setCountry("us")}
        >
          {t.hotspots.unitedStates}
        </button>
        <button
          className={`${styles.toggleBtn} ${country === "ca" ? styles.toggleBtnActive : ""}`}
          onClick={() => setCountry("ca")}
        >
          {t.hotspots.canada}
        </button>
      </div>

      {/* ── Map ── */}
      <section className={styles.mapSection} style={{ marginTop: 24 }}>
        <div className={styles.mapWrap}>
          {isLoading ? (
            <div className={styles.mapPlaceholder}>
              <span>{t.hotspots.loadingMap}</span>
            </div>
          ) : hotspots.length === 0 ? (
            <div className={styles.mapPlaceholder}>
              <span>{t.hotspots.noData}</span>
              <span style={{ fontSize: 12 }}>{t.hotspots.noDataSub}</span>
            </div>
          ) : (
            <Suspense fallback={<div className={styles.mapPlaceholder}><span>{t.hotspots.loadingMap}</span></div>}>
              <HotspotsMap hotspots={hotspots} />
            </Suspense>
          )}
        </div>
      </section>

      {/* ── Table ── */}
      <section className={styles.tableSection}>
        <div className={styles.sectionLabel}>{t.hotspots.rankedLabel}</div>
        <h2 className={styles.sectionHeadline}>{t.hotspots.sectionHeadline}</h2>

        {noDb && (
          <div className={styles.noDbBanner}>{t.hotspots.noDbBanner}</div>
        )}

        {isLoading && (
          <p style={{ color: "#7A6F65", fontSize: 14 }}>{t.hotspots.loading}</p>
        )}

        {!isLoading && (
          <table className={styles.table}>
            <thead>
              <tr>
                <Th label={t.hotspots.colRank} col="rank" active={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label={t.hotspots.colTract} col="city" active={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label={t.hotspots.colSearches} col="search_count" active={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label={t.hotspots.colAvgScore} col="avg_score" active={sortKey} dir={sortDir} onClick={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    {noDb ? t.hotspots.emptyNoDb : t.hotspots.emptyDefault}
                  </td>
                </tr>
              ) : (
                sorted.map(h => (
                  <tr key={h.fips}>
                    <td className={`${styles.td} ${styles.tdRank}`}>#{h.rank}</td>
                    <td className={styles.td}>
                      <Link
                        href={`/result?address=${encodeURIComponent(h.city + (country === "ca" ? ", Canada" : ""))}`}
                        className={styles.rowLink}
                      >
                        <div style={{ fontWeight: 600 }}>{h.city}</div>
                        <div style={{ fontSize: 12, color: "#7A6F65" }}>{t.hotspots.fipsPrefix} {h.fips}</div>
                      </Link>
                    </td>
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {h.search_count.toLocaleString()}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.tdScore}
                        style={{ color: scoreColor(h.avg_score) }}
                      >
                        {h.avg_score}
                      </span>
                      <span style={{ fontSize: 11, color: "#7A6F65", marginLeft: 6 }}>
                        {riskLabel(h.avg_score, t)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Media section ── */}
      <section className={styles.mediaSection}>
        <div className={styles.mediaInner}>
          <h2 className={styles.mediaHeadline}>{t.hotspots.mediaHeadline}</h2>
          <p className={styles.mediaBody}>{t.hotspots.mediaBody}</p>
          <a href={`/api/hotspots/csv?country=${country}`} className={styles.downloadBtn} download>
            {t.hotspots.downloadCsv}
          </a>
        </div>
      </section>

      <div className={styles.privacy}>{t.hotspots.privacy}</div>

    </div>
  );
}
