import React, { Suspense, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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

async function fetchSchools(lat: number, lng: number): Promise<SchoolResult[]> {
  const res = await fetch(`/api/schools?lat=${lat}&lng=${lng}`);
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
  const highCount = schools.filter(s => s.risk_level === "High").length;
  const majority = highCount > schools.length / 2;

  const text = `${highCount} of ${schools.length} institution${schools.length !== 1 ? "s" : ""} near this address ${highCount === 1 ? "is" : "are"} HIGH RISK.`;

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
          href={`/result?address=${encodeURIComponent(school.address)}`}
          className={styles.viewLink}
        >
          View full report →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Schools() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { data: schools, isLoading: schoolsLoading, error: schoolsError } = useQuery<SchoolResult[], Error>({
    queryKey: ["schools", coords?.lat, coords?.lng],
    queryFn: () => fetchSchools(coords!.lat, coords!.lng),
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
      setGeocodeError('Could not find that address. Try a full street address like "123 Main St, Chicago, IL".');
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
        <div className={styles.heroLabel}>SCHOOLS &amp; DAYCARES</div>
        <h1 className={styles.heroHeadline}>Is your child's school safe?</h1>
        <p className={styles.heroBody}>
          Lead exposure is especially dangerous for children. Check any school, daycare, or childcare
          facility in your area.
        </p>

        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Enter your address or school name"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className={styles.searchBtn} disabled={isLoading}>
            {isLoading ? "Searching…" : "Check area"}
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
                    <strong>Google Places API key required.</strong><br />
                    Add <code>GOOGLE_PLACES_API_KEY</code> to your environment secrets
                    (can be the same key as GOOGLE_CIVIC_API_KEY if the Places API is enabled).
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
              No schools or daycares found within 1 mile. Try a more specific address.
            </div>
          )}
        </div>
      )}

      {/* ── EPA 3Ts section ── */}
      <section className={styles.epaSection}>
        <div className={styles.epaInner}>
          <div className={styles.epaMeta}>KNOW YOUR RIGHTS</div>
          <h2 className={styles.epaHeadline}>What schools are required to do</h2>
          <div className={styles.epaPanels}>
            <div className={styles.epaPanel}>
              <h3>The EPA's 3Ts Program</h3>
              <p>
                The EPA's <em>3Ts for Reducing Lead in Drinking Water in Schools</em> (Training,
                Testing, and Taking Action) requires schools that own their buildings to test drinking
                water outlets for lead. Under the 2021 Infrastructure Law, states now receive federal
                funding specifically to test and remediate lead in school water systems.
              </p>
              <a
                href="https://www.epa.gov/ground-water-and-drinking-water/3ts-reducing-lead-drinking-water-schools-and-child-care-facilities"
                target="_blank"
                rel="noreferrer"
                className={styles.epaLink}
              >
                Read the EPA 3Ts guidance ↗
              </a>
            </div>

            <div className={styles.epaPanel}>
              <h3>What parents can request</h3>
              <p>
                You have the right to ask your school principal or administrator for a copy of
                their most recent drinking water lead test results. Federally-funded schools must
                make this data available. Ask specifically for results by outlet (faucet, fountain,
                sink) — not just a building-level average. If they haven't tested in the past two
                years, request that they do so immediately and document your request in writing.
              </p>
            </div>

            <div className={styles.epaPanel}>
              <h3>How to file a complaint</h3>
              <p>
                If a school refuses to test, share results, or take action after results show lead
                above 15 ppb, you can file a complaint with your state drinking water program. You
                may also contact the EPA's Safe Drinking Water Hotline. For schools receiving Title I
                federal funding, non-compliance can be reported to the Department of Education's
                Office of Elementary and Secondary Education.
              </p>
              <a
                href="https://www.epa.gov/ground-water-and-drinking-water/drinking-water-hotline"
                target="_blank"
                rel="noreferrer"
                className={styles.epaLink}
              >
                EPA Safe Drinking Water Hotline ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
