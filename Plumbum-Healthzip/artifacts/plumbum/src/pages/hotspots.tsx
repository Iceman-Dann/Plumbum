import React, { Suspense, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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

function riskLabel(score: number): string {
  if (score >= 65) return "High";
  if (score >= 35) return "Moderate";
  return "Low";
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
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data, isLoading, error } = useQuery<{ hotspots: Hotspot[]; error?: string }, Error>({
    queryKey: ["hotspots"],
    queryFn: async () => {
      const res = await fetch("/api/hotspots");
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
          LIVE DATA
        </div>
        <h1 className={styles.headline}>Where communities are looking</h1>
        <p className={styles.subtext}>
          Every search on Plumbum is anonymously logged by census tract. When a community
          searches repeatedly, it signals concern. This map shows where people are looking —
          and what they're finding.
        </p>
      </section>

      {/* ── Map ── */}
      <section className={styles.mapSection}>
        <div className={styles.mapWrap}>
          {isLoading ? (
            <div className={styles.mapPlaceholder}>
              <span>Loading map…</span>
            </div>
          ) : hotspots.length === 0 ? (
            <div className={styles.mapPlaceholder}>
              <span>No hotspot data yet.</span>
              <span style={{ fontSize: 12 }}>Tracts will appear here as communities search.</span>
            </div>
          ) : (
            <Suspense fallback={<div className={styles.mapPlaceholder}><span>Loading map…</span></div>}>
              <HotspotsMap hotspots={hotspots} />
            </Suspense>
          )}
        </div>
      </section>

      {/* ── Table ── */}
      <section className={styles.tableSection}>
        <div className={styles.sectionLabel}>RANKED BY SEARCH VOLUME</div>
        <h2 className={styles.sectionHeadline}>Most-searched census tracts</h2>

        {noDb && (
          <div className={styles.noDbBanner}>
            <strong>Database not connected.</strong> Add a <code>DATABASE_URL</code> Postgres
            connection to start tracking searches. Until then, all searches are scored in
            real-time but not persisted — no hotspot data accumulates.
          </div>
        )}

        {isLoading && (
          <p style={{ color: "#7A6F65", fontSize: 14 }}>Loading…</p>
        )}

        {!isLoading && (
          <table className={styles.table}>
            <thead>
              <tr>
                <Th label="Rank" col="rank" active={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label="Census Tract / City" col="city" active={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label="Searches (30 days)" col="search_count" active={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label="Avg Risk Score" col="avg_score" active={sortKey} dir={sortDir} onClick={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    {noDb
                      ? "Connect a database to begin accumulating hotspot data."
                      : "No census tracts have received more than 5 searches in the past 30 days yet. Check back as your community uses Plumbum."}
                  </td>
                </tr>
              ) : (
                sorted.map(h => (
                  <tr key={h.fips}>
                    <td className={`${styles.td} ${styles.tdRank}`}>#{h.rank}</td>
                    <td className={styles.td}>
                      <Link
                        href={`/result?address=${encodeURIComponent(h.city)}`}
                        className={styles.rowLink}
                      >
                        <div style={{ fontWeight: 600 }}>{h.city}</div>
                        <div style={{ fontSize: 12, color: "#7A6F65" }}>FIPS {h.fips}</div>
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
                        {riskLabel(h.avg_score)}
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
          <h2 className={styles.mediaHeadline}>Media and research access</h2>
          <p className={styles.mediaBody}>
            Journalists and researchers can download the full anonymized hotspot dataset as CSV.
            Updated daily. Contains only census tract FIPS codes, search counts, average risk scores,
            and approximate centroids — no addresses, no personal data.
          </p>
          <a href="/api/hotspots/csv" className={styles.downloadBtn} download>
            ↓ Download CSV
          </a>
        </div>
      </section>

      {/* ── Privacy ── */}
      <div className={styles.privacy}>
        <strong>Privacy:</strong> No addresses are stored. No personal data is collected. Search logs
        contain only census tract FIPS codes, timestamps, and anonymous session IDs generated fresh
        per request. Full privacy policy at plumbum.io/privacy.
      </div>

    </div>
  );
}
