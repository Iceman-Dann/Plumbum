// city.tsx — Dynamic city page. Fetches live /api/risk scores for every
// neighborhood in the city and builds a real ranked table from the results.
import { useState, useEffect, Suspense } from "react";
import React from "react";
import { useRoute, Link } from "wouter";
import { mockCities } from "@/lib/mockData";
import SearchBar from "@/components/SearchBar";
import styles from "../styles/city.module.css";

const LeafletMap = React.lazy(() => import("@/components/map/leaflet-map"));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NeighborhoodResult {
  loading: boolean;
  score: number | null;
  riskLevel: "Low" | "Moderate" | "High" | null;
  factors: string[];
  geocodedAddress: string | null;
  error: boolean;
}

type SortKey = "name" | "score";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number | null): string {
  if (score === null) return "#888880";
  if (score >= 65) return "#A63D2F";
  if (score >= 35) return "#C08020";
  return "#2D6A4F";
}

function riskBadgeStyle(level: string | null): React.CSSProperties {
  const color =
    level === "High" ? "#A63D2F" : level === "Moderate" ? "#C08020" : level === "Low" ? "#2D6A4F" : "#888880";
  return {
    display: "inline-block",
    padding: "2px 10px",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color,
    border: `1px solid ${color}`,
    whiteSpace: "nowrap" as const,
  };
}

// ---------------------------------------------------------------------------
// Skeleton shimmer for loading rows
// ---------------------------------------------------------------------------

function Shimmer({ width = "80px" }: { width?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width,
        height: "14px",
        background: "linear-gradient(90deg, #EDEAE3 25%, #F8F6F1 50%, #EDEAE3 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
        verticalAlign: "middle",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// City page component
// ---------------------------------------------------------------------------

export default function City() {
  const [, params] = useRoute("/city/:slug");
  const slug = params?.slug ?? "";
  const city = mockCities.find((c) => c.slug === slug);

  // Per-neighborhood result state
  const [results, setResults] = useState<Record<string, NeighborhoodResult>>({});
  const [fetchStarted, setFetchStarted] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ---------------------------------------------------------------------------
  // Fire parallel API calls when the city loads
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!city) return;
    setFetchStarted(false);

    // Initialise all rows in loading state
    const initial: Record<string, NeighborhoodResult> = {};
    city.neighborhoods.forEach((n) => {
      initial[n.name] = {
        loading: true,
        score: null,
        riskLevel: null,
        factors: [],
        geocodedAddress: null,
        error: false,
      };
    });
    setResults(initial);
    setFetchStarted(true);

    // Fire all requests in parallel — each row updates independently as it resolves
    city.neighborhoods.forEach(async (n) => {
      try {
        const res = await fetch(`/api/risk?address=${encodeURIComponent(n.address)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        setResults((prev) => ({
          ...prev,
          [n.name]: {
            loading: false,
            score: data.score,
            riskLevel: data.risk_level,
            factors: data.factors,
            geocodedAddress: data.geocoded_address,
            error: false,
          },
        }));
      } catch {
        setResults((prev) => ({
          ...prev,
          [n.name]: {
            loading: false,
            score: null,
            riskLevel: null,
            factors: [],
            geocodedAddress: null,
            error: true,
          },
        }));
      }
    });
  }, [slug]); // Re-run when slug changes

  // ---------------------------------------------------------------------------
  // Derived stats (computed from settled results)
  // ---------------------------------------------------------------------------
  const settled = Object.values(results).filter((r) => !r.loading && !r.error && r.score !== null);
  const totalFetched = Object.values(results).filter((r) => !r.loading).length;
  const totalNeighborhoods = city?.neighborhoods.length ?? 0;
  const allDone = totalFetched === totalNeighborhoods && totalNeighborhoods > 0;

  const avgScore =
    settled.length > 0
      ? Math.round(settled.reduce((s, r) => s + (r.score ?? 0), 0) / settled.length)
      : null;
  const highestRiskEntry =
    settled.length > 0
      ? settled.reduce((best, r) => ((r.score ?? 0) > (best.score ?? 0) ? r : best), settled[0])
      : null;
  const highestRiskNeighbor = city?.neighborhoods.find(
    (n) => results[n.name] === highestRiskEntry
  );
  const highRiskCount = settled.filter((r) => r.riskLevel === "High").length;

  // ---------------------------------------------------------------------------
  // Sort rows
  // ---------------------------------------------------------------------------
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedNeighborhoods = city
    ? [...city.neighborhoods].sort((a, b) => {
        if (sortKey === "name") {
          return sortDir === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        // Sort by score — loading rows go to bottom
        const sa = results[a.name]?.score ?? -1;
        const sb = results[b.name]?.score ?? -1;
        return sortDir === "asc" ? sa - sb : sb - sa;
      })
    : [];

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------
  if (!city) {
    return (
      <div style={{ padding: "96px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#888880", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          City not found
        </p>
        <Link href="/" style={{ color: "#A63D2F", fontSize: "14px", marginTop: "16px", display: "inline-block" }}>
          ← Back to search
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.wrapper}>
      {/* Shimmer keyframe injected globally */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.container}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#888880", marginBottom: "16px" }}>
            CITY REPORT
          </p>
          <h1 className={styles.headline}>{city.name}</h1>
          <p className={styles.subhead}>
            {city.state} &nbsp;·&nbsp; POPULATION {city.population}
          </p>

          {/* Live fetch progress indicator */}
          {fetchStarted && !allDone && (
            <p style={{ marginTop: "24px", fontSize: "12px", color: "#888880" }}>
              Fetching live risk data — {totalFetched} of {totalNeighborhoods} neighborhoods analyzed...
            </p>
          )}
          {allDone && (
            <p style={{ marginTop: "24px", fontSize: "12px", color: "#A63D2F", fontWeight: 600 }}>
              Live risk data loaded — all {totalNeighborhoods} neighborhoods analyzed
            </p>
          )}
        </div>
      </header>

      {/* Map */}
      <div className={styles.mapContainer}>
        <Suspense fallback={<div className={styles.mapPlaceholder} />}>
          <LeafletMap lat={city.lat} lng={city.lng} zoom={12} interactive={true} />
        </Suspense>
      </div>

      {/* Stats strip — updates as data loads */}
      <section className={styles.statsStrip}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statNum} style={{ color: avgScore !== null ? scoreColor(avgScore) : "#1A1A18" }}>
                {avgScore !== null ? avgScore : <Shimmer width="80px" />}
              </div>
              <div className={styles.statLabel}>AVG RISK SCORE</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statNum}>
                {settled.length > 0 ? highRiskCount : <Shimmer width="40px" />}
              </div>
              <div className={styles.statLabel}>HIGH-RISK NEIGHBORHOODS</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statNum}>
                {highestRiskNeighbor ? highestRiskNeighbor.name : <Shimmer width="120px" />}
              </div>
              <div className={styles.statLabel}>HIGHEST RISK AREA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhood table */}
      <section className={styles.tableSection}>
        <div className={styles.container}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "48px" }}>
            <h2 className={styles.tableTitle}>Neighborhood Breakdown</h2>
            <span style={{ fontSize: "11px", color: "#888880", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {allDone ? "Live data" : `${totalFetched}/${totalNeighborhoods} loaded`}
            </span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    data-testid="th-neighborhood"
                  >
                    Neighborhood{" "}
                    {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("score")}
                    data-testid="th-score"
                  >
                    Risk Score{" "}
                    {sortKey === "score" && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                  <th>Risk Level</th>
                  <th>Top Factor</th>
                  <th>Geocoded Address</th>
                </tr>
              </thead>
              <tbody>
                {sortedNeighborhoods.map((n) => {
                  const r = results[n.name];
                  return (
                    <tr key={n.name} data-testid={`row-neighborhood-${n.name}`}>
                      <td className={styles.tdName}>{n.name}</td>
                      <td>
                        {!r || r.loading ? (
                          <div className={styles.scoreCell}>
                            <Shimmer width="24px" />
                            <div className={styles.scoreBarBg} />
                          </div>
                        ) : r.error ? (
                          <span style={{ fontSize: "12px", color: "#888880" }}>Unavailable</span>
                        ) : (
                          <div className={styles.scoreCell}>
                            <span style={{ fontWeight: 700, color: scoreColor(r.score), minWidth: "28px" }}>
                              {r.score}
                            </span>
                            <div className={styles.scoreBarBg}>
                              <div
                                className={styles.scoreBarFill}
                                style={{
                                  width: `${r.score ?? 0}%`,
                                  backgroundColor: scoreColor(r.score),
                                  transition: "width 0.6s ease",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        {!r || r.loading ? (
                          <Shimmer width="80px" />
                        ) : r.error ? (
                          "—"
                        ) : (
                          <span style={riskBadgeStyle(r.riskLevel)}>
                            {r.riskLevel} Risk
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "13px", color: "#888880", maxWidth: "240px" }}>
                        {!r || r.loading ? (
                          <Shimmer width="160px" />
                        ) : r.error ? (
                          "Could not geocode"
                        ) : r.factors.length > 0 ? (
                          r.factors[0]
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: "#888880" }}>
                        {!r || r.loading ? (
                          <Shimmer width="200px" />
                        ) : r.geocodedAddress ? (
                          <Link
                            href={`/result?address=${encodeURIComponent(n.address)}`}
                            style={{ color: "#A63D2F", textDecoration: "underline" }}
                            data-testid={`link-result-${n.name}`}
                          >
                            {r.geocodedAddress.split(",").slice(0, 2).join(",")}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom search bar pre-filled with city */}
      <section className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <h2 className={styles.searchTitle}>Check a specific address in {city.name}</h2>
          <SearchBar initialAddress={`${city.name}, ${city.state}`} />
        </div>
      </section>
    </div>
  );
}
