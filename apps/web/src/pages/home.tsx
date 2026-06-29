import { useState, useEffect, Suspense, lazy, useRef } from "react";
import { useGetStats } from "@workspace/api-client-react";
import SearchBar from "@/components/SearchBar";
import { featuredCities } from "@/lib/featuredCities";
import { useTranslation } from "@/hooks/useTranslation";
import { Link, useLocation } from "wouter";
import styles from "../styles/home.module.css";

const LeafletMap = lazy(() => import("@/components/map/leaflet-map"));

// ---------------------------------------------------------------------------
// Fetches a LIVE risk score from /api/risk for a single representative address.
// Used to replace the old hardcoded riskPercent on each city card.
// ---------------------------------------------------------------------------
function useCityScore(address: string): { score: number | null; loading: boolean } {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setScore(null);
    fetch(`/api/risk?address=${encodeURIComponent(address)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data?.score !== undefined) {
          setScore(data.score as number);
        }
      })
      .catch(() => { /* silently fail — card shows "—" */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [address]);

  return { score, loading };
}

function CityCard({ city }: { city: typeof featuredCities[0] }) {
  const { t } = useTranslation();
  // First neighborhood address is used as the city's representative sample
  const repAddress = city.neighborhoods[0].address;
  const { score, loading } = useCityScore(repAddress);

  const barColor =
    score === null ? "#888880"
    : score >= 65 ? "#A63D2F"
    : score >= 35 ? "#C08020"
    : "#2D6A4F";

  return (
    <Link href={`/city/${city.slug}`} className={`${styles.cityCard} ${loading ? styles.loadingCard : ""}`}>
      <div className={styles.cityHeader}>
        <div className={styles.cityName}>{city.name}</div>
        <span 
          className={`${styles.statusDot} ${loading ? styles.loadingDot : ""}`} 
          style={{ backgroundColor: loading ? "var(--color-border)" : barColor }} 
        />
      </div>
      <div className={styles.cityState}>{city.state}</div>

      <div className={styles.cityBarBg}>
        <div
          className={styles.cityBarFill}
          style={{
            width: loading ? "100%" : score !== null ? `${score}%` : "0%",
            backgroundColor: loading ? "var(--color-border)" : barColor,
            transition: "width 0.9s ease, background-color 0.4s ease",
            opacity: loading ? 0.5 : 1,
          }}
        />
      </div>

      {loading ? (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonScore} />
          <div className={styles.skeletonText} />
        </div>
      ) : (
        <>
          <div className={styles.cityPercent} style={{ color: barColor }}>
            {score !== null ? `${score}%` : "—"}
          </div>
          <div className={styles.cityPercentLabel}>
            {t.home.cityPercentLabel}
          </div>
        </>
      )}
    </Link>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { data: stats } = useGetStats();
  const [, setLocation] = useLocation();
  const [listingUrl, setListingUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  const citiesScrollRef = useRef<HTMLDivElement>(null);

  const scrollCitiesLeft = () => {
    if (citiesScrollRef.current) {
      citiesScrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollCitiesRight = () => {
    if (citiesScrollRef.current) {
      citiesScrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const handleListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = listingUrl.trim();
    if (!trimmed) return;
    setUrlLoading(true);
    setLocation(`/listing-result?url=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className={styles.wrapper}>

      <section className={styles.hero}>
        <div className={styles.heroSplit}>
          <div className={styles.heroLeft}>
            <div className={styles.telemetryBadge}>
              <span className={styles.liveIndicator}></span>
              INDEX: {stats?.homes_at_risk ?? '9.2M'} HOMES AT RISK IDENTIFIED
            </div>
            <h1 className={styles.headline}>{t.home.headline}</h1>
            <p className={styles.heroBody}>{t.home.subtext}</p>
            <div className={styles.searchBarWrapper}>
              <SearchBar hideUrlForm={true} flat={true} />
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroGraphicCard}>
              <div className={styles.mapContainer}>
                <Suspense fallback={<div className={styles.mapPlaceholder}>Loading telemetry map...</div>}>
                  <LeafletMap
                    lat={42.3314}
                    lng={-83.0458}
                    zoom={12}
                    interactive={false}
                    hideOverlays={false}
                  />
                </Suspense>
              </div>
              {/* Floating Dossier Card Overlay */}
              <div className={styles.floatingDossier}>
                <div className={styles.dossierHeader}>
                  <span className={styles.telemetryDot}></span>
                  <span className={styles.dossierBadge}>SAMPLE DOSSIER</span>
                </div>
                <div className={styles.dossierLine}>
                  <span className={styles.dossierLabel}>Target:</span>
                  <span className={styles.dossierValue}>124 Maple St</span>
                </div>
                <div className={styles.dossierLine}>
                  <span className={styles.dossierLabel}>Risk Score:</span>
                  <span className={`${styles.dossierValue} ${styles.highRisk}`}>84/100 (HIGH)</span>
                </div>
                <div className={styles.dossierLine}>
                  <span className={styles.dossierLabel}>Factor:</span>
                  <span className={styles.dossierValue}>Pre-1986 construction age</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.trustSeals}>
        <div className={styles.trustSealsContainer}>
          <span className={styles.trustLabel}>LIVE TELEMETRY STREAM:</span>
          <span className={styles.trustSeal}>
            <span className={styles.telemetryDot}></span>
            US CENSUS ACS
          </span>
          <span className={styles.trustSeal}>
            <span className={styles.telemetryDot}></span>
            EPA SDWIS
          </span>
          <span className={styles.trustSeal}>
            <span className={styles.telemetryDot}></span>
            HUD HAZARDS
          </span>
          <span className={styles.trustSeal}>
            <span className={styles.telemetryDot}></span>
            USGS SURVEYS
          </span>
        </div>
      </div>

      <section className={styles.arsenalSection}>
        <div className={styles.arsenalContainer}>
          <div className={styles.arsenalHeader}>
            <h2 className={styles.arsenalTitle}>REMEDIATION PROTOCOLS</h2>
            <p className={styles.arsenalSubtitle}>{t.home.civicArsenalSubtitle}</p>
          </div>
          <div className={styles.arsenalGrid}>
            <div
              onClick={() => {
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => searchInput.focus(), 600);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => searchInput.focus(), 600);
                  }
                }
              }}
              tabIndex={0}
              role="button"
              className={styles.arsenalCard}
            >
              <div className={styles.arsenalCardHeader}>
                <span className={styles.arsenalCardIndex}>01</span>
                <h3 className={styles.arsenalCardTitle}>INITIATE PUBLIC RECORDS REQUEST</h3>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolFoiaDesc}</p>
              <div className={styles.arsenalAction}>LAUNCH DRAFT TOOL →</div>
            </div>

            <div
              onClick={() => {
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => searchInput.focus(), 600);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => searchInput.focus(), 600);
                  }
                }
              }}
              tabIndex={0}
              role="button"
              className={styles.arsenalCard}
            >
              <div className={styles.arsenalCardHeader}>
                <span className={styles.arsenalCardIndex}>02</span>
                <h3 className={styles.arsenalCardTitle}>DEMAND REPRESENTATIVE INTERVENTION</h3>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolRepDesc}</p>
              <div className={styles.arsenalAction}>FIND REPRESENTATIVES →</div>
            </div>

            <div
              onClick={() => {
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => searchInput.focus(), 600);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => searchInput.focus(), 600);
                  }
                }
              }}
              tabIndex={0}
              role="button"
              className={styles.arsenalCard}
            >
              <div className={styles.arsenalCardHeader}>
                <span className={styles.arsenalCardIndex}>03</span>
                <h3 className={styles.arsenalCardTitle}>VERIFY FILTER CERTIFICATION</h3>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolFilterDesc}</p>
              <div className={styles.arsenalAction}>OPEN FILTER MATCHER →</div>
            </div>

            <div
              onClick={() => {
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => searchInput.focus(), 600);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => searchInput.focus(), 600);
                  }
                }
              }}
              tabIndex={0}
              role="button"
              className={styles.arsenalCard}
            >
              <div className={styles.arsenalCardHeader}>
                <span className={styles.arsenalCardIndex}>04</span>
                <h3 className={styles.arsenalCardTitle}>OBTAIN LABORATORY TEST KIT</h3>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolKitDesc}</p>
              <div className={styles.arsenalAction}>REQUEST TEST KIT →</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.telemetrySection}>
        <div className={styles.telemetryContainer}>
          <div className={styles.telemetryHeader}>
            <div className={styles.telemetryTitle}>
              <span className={styles.liveIndicator}></span>
              {t.home.telemetryTitle}
            </div>
            <div className={styles.telemetrySubtitle}>{t.home.telemetrySubtitle}</div>
          </div>
          <div className={styles.telemetryGrid}>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>
                {stats?.homes_at_risk ?? '9.2M'}
              </div>
              <div className={styles.telemetryLabel}>▪ sys.est_risk</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>
                {stats?.children_affected ?? '400K'}
              </div>
              <div className={styles.telemetryLabel}>▪ sys.ped_impact</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>
                {((stats as any)?.addresses_monitored !== undefined)
                  ? Number((stats as any).addresses_monitored).toLocaleString()
                  : "2,400,000"}
              </div>
              <div className={styles.telemetryLabel}>▪ sys.monitored</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>0.87</div>
              <div className={styles.telemetryLabel}>▪ sys.auc_roc</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Journalist & Homebuyer Tools Section ── */}
      <section className={styles.toolsSection}>
        <div className={styles.toolsContainer}>
          <div className={styles.toolsHeader}>
            <h2 className={styles.toolsTitle}>Journalist & Homebuyer Tools</h2>
            <p className={styles.toolsSubtitle}>
              Analyze real estate listings and inspect pipeline data on the fly.
            </p>
          </div>
          <div className={styles.toolsGrid}>
            {/* Tool 1: Browser Extension */}
            <div className={styles.toolCard}>
              <div className={styles.toolIconWrap}>
                <svg className={styles.toolIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="21.17" y1="8" x2="12" y2="8" />
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                </svg>
              </div>
              <h3 className={styles.toolCardTitle}>Browser Extension</h3>
              <p className={styles.toolCardDesc}>
                Add Plumbum's predictive lead water risk overlay directly onto Zillow and Redfin listings.
              </p>
              <Link href="/extension" className={styles.toolButton}>
                Get Extension
              </Link>
            </div>

            {/* Tool 2: URL Scanner */}
            <div className={styles.toolCard}>
              <div className={styles.toolIconWrap}>
                <svg className={styles.toolIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3 className={styles.toolCardTitle}>Listing URL Scanner</h3>
              <p className={styles.toolCardDesc}>
                Paste any Zillow or Redfin property link below to scan construction records and fetch immediate risk ratings.
              </p>
              <form onSubmit={handleListingSubmit} className={styles.toolsUrlForm}>
                <input
                  type="url"
                  placeholder="Paste Zillow or Redfin URL"
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  className={styles.toolsUrlInput}
                  required
                />
                <button type="submit" className={styles.toolsUrlButton} disabled={urlLoading}>
                  {urlLoading ? "Scanning..." : "Scan URL"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.citiesSection}>
        <div className={styles.citiesContainer}>
          <div className={styles.citiesHeader}>
            <div className={styles.citiesLabel}>{t.home.citiesLabel}</div>
            <div className={styles.citiesScrollArrows}>
              <button onClick={scrollCitiesLeft} className={styles.scrollArrowBtn} aria-label="Scroll left">←</button>
              <button onClick={scrollCitiesRight} className={styles.scrollArrowBtn} aria-label="Scroll right">→</button>
            </div>
          </div>

          <div className={styles.citiesScroll} ref={citiesScrollRef}>
            {featuredCities.map(city => (
              <CityCard key={city.slug} city={city} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Accountability Hub Section ── */}
      <section className={styles.accountabilitySection}>
        <div className={styles.accountabilityContainer}>
          <div className={styles.accountabilityHeader}>
            <span className={styles.telemetryDot} />
            <h2 className={styles.accountabilityTitle}>Public Accountability Hub</h2>
            <p className={styles.accountabilitySubtitle}>
              Independent compliance directories monitoring community-wide lead water safety standards.
            </p>
          </div>
          
          <div className={styles.accountabilityGrid}>
            {/* Left Side: School Compliance Audits */}
            <div className={styles.hubCard}>
              <div className={styles.hubCardHeader}>
                <span className={styles.liveIndicatorGreen} />
                <h3 className={styles.hubCardTitle}>School District Compliance</h3>
              </div>
              <p className={styles.hubCardDesc}>
                Verify compliance records and review recent laboratory testing results for local K-12 public schools.
              </p>
              
              <div className={styles.hubMockupTable}>
                <div className={styles.hubTableHeader}>
                  <span>School / Facility</span>
                  <span>Test Value</span>
                  <span>Compliance</span>
                </div>
                {[
                  { name: "Lincoln Elementary School", val: "1.2 ppb", status: "PASS", cls: styles.passStatus },
                  { name: "Cass Technical High School", val: "18.4 ppb", status: "EXCEEDED", cls: styles.failStatus },
                  { name: "Cornerstone Charter Academy", val: "2.1 ppb", status: "PASS", cls: styles.passStatus },
                ].map((s, idx) => (
                  <div key={idx} className={styles.hubTableRow}>
                    <span className={styles.hubSchoolName}>{s.name}</span>
                    <span className={styles.hubSchoolVal}>{s.val}</span>
                    <span className={`${styles.hubStatusBadge} ${s.cls}`}>{s.status}</span>
                  </div>
                ))}
              </div>
              <Link href="/schools" className={styles.hubButton}>
                School Directory →
              </Link>
            </div>

            {/* Right Side: Landlord Compliance Tracker */}
            <div className={styles.hubCard}>
              <div className={styles.hubCardHeader}>
                <span className={styles.liveIndicatorRed} />
                <h3 className={styles.hubCardTitle}>Landlord Lead Registry</h3>
              </div>
              <p className={styles.hubCardDesc}>
                Search tenant-submitted compliance records to verify if landlords have conducted mandatory plumbing inspections.
              </p>
              
              <div className={styles.hubMockupTable}>
                <div className={styles.hubTableHeader}>
                  <span>Management Group / Landlord</span>
                  <span>Property</span>
                  <span>Response</span>
                </div>
                {[
                  { name: "Kingswood Properties LLC", prop: "1822 Jefferson Ave", status: "REFUSED", cls: styles.failStatus },
                  { name: "Metro Housing Group", prop: "3301 Gratiot Ave", status: "PENDING", cls: styles.pendingStatus },
                  { name: "Urban Core Rentals", prop: "948 W Vernor Hwy", status: "AGREED", cls: styles.agreedStatus },
                ].map((l, idx) => (
                  <div key={idx} className={styles.hubTableRow}>
                    <div>
                      <span className={styles.hubLandlordName}>{l.name}</span>
                      <span className={styles.hubLandlordProp}>{l.prop}</span>
                    </div>
                    <span className={`${styles.hubStatusBadge} ${l.cls}`}>{l.status}</span>
                  </div>
                ))}
              </div>
              <Link href="/accountability" className={styles.hubButton}>
                Tenant Registry →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.manifestoSection}>
        <div className={styles.manifestoContainer}>
          <h2 className={styles.manifestoTitle}>{t.home.manifestoTitle}</h2>
          <p className={styles.manifestoBody}>{t.home.manifestoBody}</p>
          <div className={styles.manifestoLinks}>
            <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.manifestoLink}>
              {t.home.manifestoGithub}
            </a>
            <Link href="/methodology" className={styles.manifestoLink}>
              {t.home.manifestoPaper}
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.methodologySection}>
        <div className={styles.methodologyContainer}>
          <div className={styles.methodologyLeft}>
            <h2 className={styles.methodologyTitle}>{t.home.methodologyTitle}</h2>
            <p className={styles.methodologyBody}>{t.home.methodologyBody}</p>
            <Link href="/methodology" className={styles.methodologyLink}>
              {t.home.methodologyLink}
            </Link>
          </div>

          <div className={styles.methodologyRight}>
            <div className={styles.sourcesLabel}>{t.home.sourcesLabel}</div>
            <div className={styles.sourcesGrid}>
              <span className={styles.sourcePill}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceAcs}
              </span>
              <span className={styles.sourcePill}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceEpa}
              </span>
              <span className={styles.sourcePill}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceParcel}
              </span>
              <span className={styles.sourcePill}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceLsl}
              </span>
              <span className={styles.sourcePill}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourcePlumbing}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Built for Researchers API Section ── */}
      <section className={styles.apiSection}>
        <div className={styles.apiContainer}>
          <div className={styles.apiLeft}>
            <div className={styles.citiesEyebrow}>Developer API</div>
            <h2 className={styles.apiTitle}>{t.home.apiTitle}</h2>
            <p className={styles.apiBody}>{t.home.apiBody}</p>
            <Link href="/api-docs" className={styles.apiLink} data-testid="home-api-link">
              {t.home.apiLink}
            </Link>
          </div>
          
          <div className={styles.apiTerminal}>
            <div className={styles.apiTerminalHeader}>
              <span className={styles.apiTerminalShell}>bash</span>
              <span className={styles.apiTerminalTitle}>GET /api/risk?address=124+Maple+St</span>
            </div>
            <pre className={styles.apiTerminalCode}>
{`{
  "address": "124 Maple St, Flint, MI 48503",
  "score": 84,
  "risk_level": "HIGH",
  "factors": [
    "construction_pre_1986",
    "epa_violation_10yr"
  ],
  "telemetry": {
    "lead_service_line": "LIKELY_LEAD",
    "census_tract_fips": "26049000100",
    "pwsid": "MI0002310"
  }
}`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
