import React, { Suspense, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { interpolate } from "@/lib/translations";
import { usePregnancyMode } from "@/hooks/usePregnancyMode";
import styles from "../styles/schools.module.css";

// Dynamic Leaflet import to avoid SSR issues
const SchoolsMap = React.lazy(() => import("../components/map/schools-map"));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchoolResult {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  institution_type: "SCHOOL" | "DAYCARE" | "CHILDCARE";
  score: number;
  risk_level: "Low" | "Moderate" | "High";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 65) return "#A63D2F";
  if (score >= 35) return "#C07A2A";
  return "#4A7C59";
}

// ---------------------------------------------------------------------------
// Geocode via the existing /api/risk endpoint (returns lat/lng as a side-effect)
// ---------------------------------------------------------------------------

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const res = await fetch(`/api/risk?address=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error("Could not geocode address");
  const data = await res.json() as { lat: number; lng: number };
  return { lat: data.lat, lng: data.lng };
}

async function fetchSchools(lat: number, lng: number, query?: string): Promise<SchoolResult[]> {
  const url = query
    ? `/api/schools?lat=${lat}&lng=${lng}&query=${encodeURIComponent(query)}`
    : `/api/schools?lat=${lat}&lng=${lng}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? "Failed to fetch schools");
  }
  const data = await res.json() as { schools: SchoolResult[] };
  return data.schools;
}

// ---------------------------------------------------------------------------
// Summary strip
// ---------------------------------------------------------------------------

function SummaryStrip({ schools }: { schools: SchoolResult[] }) {
  const { t, lang } = useTranslation();
  const { isPregnant } = usePregnancyMode();

  if (isPregnant) {
    return (
      <div className={styles.summaryStripHigh} style={{ background: "#5C1A1A", color: "#FFF" }}>
        Pregnant women working in schools should be especially aware of lead risk. Lead exposure affects maternal and fetal health at any stage of pregnancy.
      </div>
    );
  }

  const highCount = schools.filter(s => s.risk_level === "High").length;
  const majority = highCount > schools.length / 2;

  const text = interpolate(t.schools.summaryStrip, {
    highCount,
    total: schools.length,
    verb: lang === "es" ? (highCount === 1 ? "es" : "son") : (highCount === 1 ? "is" : "are"),
  });

  if (majority) {
    return <div className={styles.summaryStripHigh}>{text}</div>;
  }
  return (
    <div className={styles.summaryStrip} style={{ background: "#F4EFE8", color: "#1A1614" }}>
      {text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// School card
// ---------------------------------------------------------------------------

function SchoolCard({
  school,
  highlighted,
  onMouseEnter,
  onMouseLeave,
}: {
  school: SchoolResult;
  highlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`${styles.card} ${highlighted ? styles.highlighted : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardName}>{school.name}</div>
        <div className={styles.cardScore} style={{ color: scoreColor(school.score) }}>
          {school.score}
        </div>
      </div>
      <div className={styles.cardAddress}>{school.address}</div>
      <div className={styles.cardFooter}>
        <span className={styles.typePill}>{school.institution_type}</span>
        <Link
          href={`/result?address=${encodeURIComponent(school.address)}&context=school&school=${encodeURIComponent(school.name)}`}
          className={styles.viewLink}
        >
          {t.schools.viewFullReport}
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Schools() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { data: schools, isLoading: schoolsLoading, error: schoolsError } = useQuery<SchoolResult[], Error>({
    queryKey: ["schools", coords?.lat, coords?.lng, query],
    queryFn: () => fetchSchools(coords!.lat, coords!.lng, query),
    enabled: !!coords,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setGeocodeError(null);
    setGeocoding(true);
    setQuery(input.trim());
    try {
      const c = await geocodeAddress(input.trim());
      setCoords(c);
    } catch {
      setGeocodeError(t.schools.geocodeError);
    } finally {
      setGeocoding(false);
    }
  };

  const hasResults = !!schools && schools.length > 0;
  const isLoading = geocoding || schoolsLoading;

  return (
    <div className={styles.wrapper}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroLabel}>{t.schools.heroLabel}</div>
        <h1 className={styles.heroHeadline}>{t.schools.headline}</h1>
        <p className={styles.heroBody}>{t.schools.heroBody}</p>

        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t.schools.placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className={styles.searchBtn} disabled={isLoading}>
            {isLoading ? t.schools.searching : t.schools.checkArea}
          </button>
        </form>

        {geocodeError && (
          <p style={{ color: "#A63D2F", fontSize: 13, marginTop: 10 }}>{geocodeError}</p>
        )}
      </section>

      {/* ── Results ── */}
      {(hasResults || isLoading || schoolsError) && (
        <div className={styles.resultsSection}>
          {/* Summary strip */}
          {hasResults && !isLoading && <SummaryStrip schools={schools} />}

          {/* Map */}
          {hasResults && !isLoading && (
            <div className={styles.mapWrap}>
              <Suspense fallback={<div style={{ height: 320, background: "#1A1614" }} />}>
                <SchoolsMap
                  schools={schools}
                  highlightedId={highlightedId}
                  onMarkerClick={id => setHighlightedId(prev => prev === id ? null : id)}
                  centerLat={coords!.lat}
                  centerLng={coords!.lng}
                />
              </Suspense>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className={styles.loadingGrid}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          )}

          {/* Error */}
          {schoolsError && !isLoading && (
            <div className={styles.stateBox}>
              {(schoolsError as Error).message.includes("GOOGLE_PLACES_API_KEY")
                ? <>
                    <strong>{t.schools.apiKeyRequired}</strong><br />
                    {t.schools.apiKeyBody}
                  </>
                : (schoolsError as Error).message
              }
            </div>
          )}

          {/* Cards */}
          {hasResults && !isLoading && (
            <div className={styles.cardsSection}>
              {schools.map(school => (
                <SchoolCard
                  key={school.place_id}
                  school={school}
                  highlighted={highlightedId === school.place_id}
                  onMouseEnter={() => setHighlightedId(school.place_id)}
                  onMouseLeave={() => setHighlightedId(null)}
                />
              ))}
            </div>
          )}

          {!isLoading && schools && schools.length === 0 && (
            <div className={styles.stateBox}>
              {t.schools.noResults}
            </div>
          )}
        </div>
      )}

      {/* ── EPA 3Ts section ── */}
      <section className={styles.epaSection}>
        <div className={styles.epaInner}>
          <div className={styles.epaMeta}>{t.schools.knowYourRights}</div>
          <h2 className={styles.epaHeadline}>{t.schools.eapHeadline}</h2>
          <div className={styles.epaPanels}>
            <div className={styles.epaPanel}>
              <h3>{t.schools.panel1Title}</h3>
              <p>{t.schools.panel1Body}</p>
              <a
                href="https://www.epa.gov/ground-water-and-drinking-water/3ts-reducing-lead-drinking-water-schools-and-child-care-facilities"
                target="_blank"
                rel="noreferrer"
                className={styles.epaLink}
              >
                {t.schools.panel1Link}
              </a>
            </div>

            <div className={styles.epaPanel}>
              <h3>{t.schools.panel2Title}</h3>
              <p>{t.schools.panel2Body}</p>
            </div>

            <div className={styles.epaPanel}>
              <h3>{t.schools.panel3Title}</h3>
              <p>{t.schools.panel3Body}</p>
              <a
                href="https://www.epa.gov/ground-water-and-drinking-water/drinking-water-hotline"
                target="_blank"
                rel="noreferrer"
                className={styles.epaLink}
              >
                {t.schools.panel3Link}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
