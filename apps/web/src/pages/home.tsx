import { useState, useEffect, Suspense, lazy, useRef, useMemo } from "react";
import { useGetStats } from "@workspace/api-client-react";
import SearchBar from "@/components/SearchBar";
import { featuredCities } from "@/lib/featuredCities";
import { useTranslation } from "@/hooks/useTranslation";
import { Link, useLocation } from "wouter";
import styles from "../styles/home.module.css";
import VideoExplainerAnimation from "@/components/VideoExplainerAnimation";
import ZillowListingDemo from "@/components/ZillowListingDemo";
import UrlScannerDemo from "@/components/UrlScannerDemo";
import { AlertTriangle, AlertOctagon, CheckCircle, Clock } from "lucide-react";

interface TickerItem {
  type: "REFUSED" | "TESTED_POSITIVE" | "AGREED_TO_TEST" | "PASS" | "EXCEEDED" | "PENDING";
  text: string;
}

function renderTickerIcon(type: string) {
  if (!type) return null;
  switch (type) {
    case "REFUSED":
    case "EXCEEDED":
      return <AlertTriangle size={14} style={{ color: "#a63d2f", flexShrink: 0 }} />;
    case "TESTED_POSITIVE":
      return <AlertOctagon size={14} style={{ color: "#7a1f0f", flexShrink: 0 }} />;
    case "AGREED_TO_TEST":
    case "PASS":
      return <CheckCircle size={14} style={{ color: "#4a7c59", flexShrink: 0 }} />;
    default:
      return <Clock size={14} style={{ color: "#7a6f65", flexShrink: 0 }} />;
  }
}

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

// ── School data from /api/schools ──────────────────────────────────────────
interface SchoolEntry {
  place_id: string;
  name: string;
  address: string;
  institution_type: string;
  score: number;
  risk_level: string;
}

// ── Landlord data from /api/accountability ──────────────────────────────────
interface AccountabilityEntry {
  id: number;
  property_address: string;
  landlord_name: string;
  management_company: string;
  landlord_response: string;
  notice_date: string;
  risk_score: number;
}

export default function Home() {
  const { t, lang } = useTranslation();
  const { data: stats } = useGetStats();
  const [, setLocation] = useLocation();
  const [listingUrl, setListingUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [geoLoc, setGeoLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [userStateCode, setUserStateCode] = useState<string>("");
  const [geoLoading, setGeoLoading] = useState(true);
  const [stateSearch, setStateSearch] = useState("");
  const [filterMyState, setFilterMyState] = useState(false);
  const [sortByHighestRisk, setSortByHighestRisk] = useState(false);
  const [showAllStates, setShowAllStates] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [searchAddress, setSearchAddress] = useState("");


  // Live schools data
  const [schools, setSchools] = useState<SchoolEntry[] | null>(null);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  // Live landlord data
  const [landlords, setLandlords] = useState<AccountabilityEntry[] | null>(null);
  const [landlordsLoading, setLandlordsLoading] = useState(false);

  // Ticker items
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(
    [
      { type: "EXCEEDED", text: "Cass Technical High School: 18.4 ppb exceedance detected" },
      { type: "REFUSED", text: "Kingswood Properties LLC: tenant reported refusal to inspect" },
      { type: "PASS", text: "Lincoln Elementary: annual test completed (1.2 ppb - PASS)" },
    ]
  );
  const [tickerIndex, setTickerIndex] = useState(0);

  // Auto-rotate ticker carousel
  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  // GitHub star count
  const [ghStars, setGhStars] = useState<number | null>(null);

  useEffect(() => {
    // Dynamic IP Geolocation for Map center & User State Code
    fetch("https://ipapi.co/json/")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setGeoLoading(false);
        if (data) {
          if (typeof data.latitude === "number" && typeof data.longitude === "number") {
            setGeoLoc({ lat: data.latitude, lng: data.longitude });
            // Fetch nearby schools from our real API
            setSchoolsLoading(true);
            fetch(`/api/schools?lat=${data.latitude}&lng=${data.longitude}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => { if (d?.schools) setSchools(d.schools.slice(0, 4)); })
              .catch(() => { /* fallback to static rows */ })
              .finally(() => setSchoolsLoading(false));
          }
          if (typeof data.region_code === "string") {
            setUserStateCode(data.region_code);
          }
        }
      })
      .catch(() => { setGeoLoading(false); });
  }, []);

  // Fetch landlord registry
  useEffect(() => {
    setLandlordsLoading(true);
    fetch("/api/accountability?sort=recent")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.list && d.list.length > 0) {
          setLandlords(d.list.slice(0, 3));
          // Build ticker from real entries
          const tickerFromDb: TickerItem[] = d.list.slice(0, 5).map((entry: AccountabilityEntry) => {
            const resp = entry.landlord_response;
            const label = resp === "REFUSED" ? "refused inspection" : resp === "TESTED_POSITIVE" ? "test returned POSITIVE" : resp === "AGREED_TO_TEST" ? "agreed to test" : "pending response";
            const name = entry.management_company || entry.landlord_name || "Property owner";
            return {
              type: resp as any,
              text: `${name}: ${label} at ${entry.property_address}`
            };
          });
          if (tickerFromDb.length > 0) setTickerItems(tickerFromDb);
        }
      })
      .catch(() => { /* keep static fallback */ })
      .finally(() => setLandlordsLoading(false));
  }, []);



  // GitHub star count
  useEffect(() => {
    fetch("https://api.github.com/repos/Iceman-Dann/Plumbum")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stargazers_count !== undefined) setGhStars(d.stargazers_count); })
      .catch(() => { /* not critical */ });
  }, []);

  const filteredStates = useMemo(() => {
    let result = [...US_STATES_RISK];
    if (stateSearch.trim()) {
      const q = stateSearch.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }
    if (filterMyState && userStateCode) {
      result = result.filter(s => s.code.toUpperCase() === userStateCode.toUpperCase());
    }
    if (sortByHighestRisk) {
      result.sort((a, b) => b.riskPercent - a.riskPercent);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [stateSearch, filterMyState, sortByHighestRisk, userStateCode]);

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

  const [zipCode, setZipCode] = useState("");
  const [zipLoading, setZipLoading] = useState(false);

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = zipCode.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      alert("Please enter a valid 5-digit ZIP code.");
      return;
    }
    setZipLoading(true);
    try {
      const address = `ZIP Code ${trimmed}, USA`;
      const response = await fetch(`/api/risk?address=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      const { generateReport } = await import("@/lib/generateReport");
      const { translations } = await import("@/lib/translations/en");
      
      await generateReport(data, address, translations, "en", false);
    } catch (err) {
      alert("Failed to generate report. Please try again.");
    } finally {
      setZipLoading(false);
    }
  };

  const [apiAddress, setApiAddress] = useState("124 Maple St, Flint, MI 48503");
  const [apiResponse, setApiResponse] = useState<string>(`{
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
}`);
  const [apiLoading, setApiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleApiPlaygroundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiLoading(true);
    try {
      const res = await fetch(`/api/risk?address=${encodeURIComponent(apiAddress)}`);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch {
      setApiResponse(JSON.stringify({ error: "Failed to fetch. Address not found or server offline." }, null, 2));
    } finally {
      setApiLoading(false);
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(apiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePillClick = (address: string) => {
    setSearchAddress(address);
    const inputEl = document.querySelector('input[data-testid="search-input"]') as HTMLInputElement;
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => inputEl.focus(), 300);
    }
  };

  return (
    <div className={styles.wrapper}>

      <section className={styles.hero}>
        <div className={styles.heroSplit}>
          <div className={styles.heroLeft}>
            <h1 className={styles.headline}>{t.home.headline}</h1>
            <p className={styles.heroSubheadline}>
              {t.home.heroSubtext}
            </p>
            <div className={styles.searchBarWrapper}>
              <SearchBar hideUrlForm={true} flat={true} initialAddress={searchAddress} />
              
              {/* Try sample city pills */}
              <div className={styles.samplePills}>
                <span className={styles.samplePillLabel}>{t.home.tryLabel}</span>
                <button
                  type="button"
                  onClick={() => handlePillClick("120 Ferry St, Newark, NJ 07105")}
                  className={styles.samplePill}
                >
                  Newark
                </button>
                <button
                  type="button"
                  onClick={() => handlePillClick("1516 Michigan Ave, Detroit, MI 48216")}
                  className={styles.samplePill}
                >
                  Detroit
                </button>
                <button
                  type="button"
                  onClick={() => handlePillClick("1850 S Halsted St, Chicago, IL 60608")}
                  className={styles.samplePill}
                >
                  Chicago
                </button>
              </div>

              {/* Sobering Fact */}
              <div className={styles.soberingFact}>
                {t.home.statHomesContamination}
              </div>



              {/* Secondary CTA */}
              <div className={styles.secondaryCtaContainer}>
                <Link href="/hotspots" className={styles.secondaryCTA}>
                  {t.home.heroCta}
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroGraphicCard}>
              <div className={styles.mapContainer}>
                <Suspense fallback={<div className={styles.mapPlaceholder}>{t.home.loadingTelemetryMap}</div>}>
                  <LeafletMap
                    lat={geoLoc?.lat ?? 42.3314}
                    lng={geoLoc?.lng ?? -83.0458}
                    zoom={geoLoc ? 11 : 12}
                    interactive={false}
                    hideOverlays={false}
                  />
                </Suspense>
              </div>
              {/* Floating Dossier Card Overlay */}
              <div className={styles.floatingDossier}>
                <div className={styles.dossierHeader}>
                  <span className={styles.telemetryDot}></span>
                  <span className={styles.dossierBadge}>{t.home.dossierSample}</span>
                </div>
                <div className={styles.dossierLine}>
                  <span className={styles.dossierLabel}>{t.home.dossierTarget}</span>
                  <span className={styles.dossierValue}>124 Maple St</span>
                </div>
                <div className={styles.dossierLine}>
                  <span className={styles.dossierLabel}>{t.home.dossierScore}</span>
                  <span className={`${styles.dossierValue} ${styles.highRisk}`}>84/100 ({lang === "es" ? "ALTO" : "HIGH"})</span>
                </div>
                <div className={styles.dossierLine}>
                  <span className={styles.dossierLabel}>{t.home.dossierFactor}</span>
                  <span className={styles.dossierValue}>
                    {lang === "es" ? "Construcción antes de 1986" : "Pre-1986 construction age"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar Section */}
      <div className={styles.trustBar}>
        <div className={styles.trustBarContainer}>
          <div className={styles.trustBarLogos}>
            <span className={styles.trustLogo}>EPA</span>
            <span className={styles.trustDivider}>▪</span>
            <span className={styles.trustLogo}>US Census Bureau</span>
            <span className={styles.trustDivider}>▪</span>
            <span className={styles.trustLogo}>HUD</span>
            <span className={styles.trustDivider}>▪</span>
            <span className={styles.trustLogo}>USGS</span>
            <span className={styles.trustDivider}>▪</span>
            <span className={styles.trustLogo}>GitHub Open Source</span>
          </div>
          <div className={styles.trustDeclaration}>
            {t.home.zeroData}
          </div>
        </div>
      </div>

      {/* Manifesto / Explainer Video Section */}
      <section className={styles.manifestoSection}>
        <div className={styles.manifestoContainer}>
          <div className={styles.manifestoLeft}>
            <h2 className={styles.manifestoTitle}>{t.home.manifestoTitle}</h2>
            <p className={styles.manifestoBody}>
              {t.home.manifestoBody}
            </p>
            <div className={styles.manifestoTrophies}>
              <a href="https://github.com/Iceman-Dann/Plumbum" target="_blank" rel="noreferrer" className={styles.trophyLink}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px', flexShrink: 0 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {lang === "es" ? "Ver Código de Fuente Abierta en GitHub" : "View Open Source Code on GitHub"}
                </span>
              </a>
              <Link href="/methodology" className={styles.trophyLink}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  {lang === "es" ? "Lea Nuestro Documento de Metodología en arXiv" : "Read Our Methodology Paper on arXiv"}
                </span>
              </Link>
            </div>
          </div>
          <div className={styles.manifestoRight}>
            <VideoExplainerAnimation />
          </div>
        </div>
      </section>

      <section className={styles.arsenalSection}>
        <div className={styles.arsenalContainer}>
          <div className={styles.arsenalHeader}>
            <h2 className={styles.arsenalTitle}>{t.home.civicArsenalTitle}</h2>
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
                <span className={styles.arsenalCardIndex}>
                  <svg className={styles.arsenalCardIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </span>
                <div className={styles.arsenalCardTitleWrapper}>
                  <div className={styles.startBadge}>{lang === "es" ? "LA MAYORÍA DE LAS FAMILIAS COMIENZAN AQUÍ" : "MOST FAMILIES START HERE"}</div>
                  <h3 className={styles.arsenalCardTitle}>{t.home.toolFoiaTitle}</h3>
                </div>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolFoiaDesc}</p>
              <div className={styles.arsenalAction}>{t.home.toolFoiaAction}</div>
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
                <span className={styles.arsenalCardIndex}>
                  <svg className={styles.arsenalCardIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <h3 className={styles.arsenalCardTitle}>{t.home.toolRepTitle}</h3>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolRepDesc}</p>
              <div className={styles.arsenalAction}>{t.home.toolRepAction}</div>
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
                <span className={styles.arsenalCardIndex}>
                  <svg className={styles.arsenalCardIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </span>
                <h3 className={styles.arsenalCardTitle}>{t.home.toolFilterTitle}</h3>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolFilterDesc}</p>
              <div className={styles.arsenalAction}>{t.home.toolFilterAction}</div>
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
                <span className={styles.arsenalCardIndex}>
                  <svg className={styles.arsenalCardIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12" />
                    <path d="M12 3v15" />
                    <path d="M9 12h6" />
                    <path d="M10 3v5c0 .7-.3 1.3-.8 1.8L4.3 15c-.4.4-.7 1-.7 1.6C3.6 17.9 4.7 19 6 19h12c1.3 0 2.4-1.1 2.4-2.4 0-.6-.3-1.2-.7-1.6l-4.9-5.2c-.5-.5-.8-1.1-.8-1.8V3" />
                  </svg>
                </span>
                <h3 className={styles.arsenalCardTitle}>{t.home.toolKitTitle}</h3>
              </div>
              <p className={styles.arsenalCardDesc}>{t.home.toolKitDesc}</p>
              <div className={styles.arsenalAction}>{t.home.toolKitAction}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Journalist & Homebuyer Tools Section ── */}
      <section className={styles.toolsSection}>
        <div className={styles.toolsContainer}>
          <div className={styles.toolsHeader}>
            <h2 className={styles.toolsTitle}>{lang === "es" ? "Herramientas para Periodistas y Compradores" : "Journalist & Homebuyer Tools"}</h2>
            <p className={styles.toolsSubtitle}>
              {lang === "es" ? "Analice listados de bienes raíces e inspeccione datos de tuberías al instante." : "Analyze real estate listings and inspect pipeline data on the fly."}
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
              <h3 className={styles.toolCardTitle}>{t.home.toolExtensionTitle}</h3>
              <p className={styles.toolCardDesc}>
                {t.home.toolExtensionDesc}
              </p>
              <div className={styles.extensionMockupContainer}>
                <ZillowListingDemo />
              </div>
              <Link href="/extension" className={styles.toolButton}>
                {t.home.toolExtensionBtn}
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
              <h3 className={styles.toolCardTitle}>{t.home.toolUrlTitle}</h3>
              <p className={styles.toolCardDesc}>
                {t.home.toolUrlDesc}
              </p>
              <form onSubmit={handleListingSubmit} className={styles.toolsUrlForm}>
                <input
                  type="url"
                  placeholder={t.home.toolUrlPlaceholder}
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  className={styles.toolsUrlInput}
                  required
                />
                <button type="submit" className={styles.toolsUrlButton} disabled={urlLoading}>
                  {urlLoading ? t.home.toolUrlLoading : t.home.toolUrlBtn}
                </button>
              </form>
              <UrlScannerDemo />
            </div>

            {/* Tool 3: Neighborhood Report */}
            <div className={styles.toolCard}>
              <div className={styles.toolIconWrap}>
                <svg className={styles.toolIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className={styles.toolCardTitle}>{t.home.toolZipTitle}</h3>
              <p className={styles.toolCardDesc}>
                {t.home.toolZipDesc}
              </p>
              <form onSubmit={handleZipSubmit} className={styles.toolsUrlForm}>
                <input
                  type="text"
                  placeholder={t.home.toolZipPlaceholder}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className={styles.toolsUrlInput}
                  maxLength={5}
                  pattern="\d{5}"
                  required
                />
                <button type="submit" className={styles.toolsUrlButton} disabled={zipLoading}>
                  {zipLoading ? t.home.toolZipLoading : t.home.toolZipBtn}
                </button>
              </form>
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
                <AnimatedNumber value="9.2M" />
              </div>
              <div className={styles.telemetryLabel}>{t.home.telemetryHomes}</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>
                <AnimatedNumber value="400,000" />
              </div>
              <div className={styles.telemetryLabel}>{t.home.telemetryChildren}</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>
                <AnimatedNumber value="120" />
              </div>
              <div className={styles.telemetryLabel}>{t.home.telemetryCities}</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>
                <AnimatedNumber value="87%" />
              </div>
              <div className={styles.telemetryLabel}>{t.home.telemetryAccuracy}</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryNum}>
                <AnimatedNumber value="12" />
              </div>
              <div className={styles.telemetryLabel}>{t.home.telemetryStates}</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.citiesSection}>
        <div className={styles.citiesContainer}>
          <div className={styles.citiesHeader}>
            <div className={styles.citiesSectionTitleBlock}>
              <h2 className={styles.citiesSectionTitle}>{t.home.stateSectionTitle}</h2>
              <p className={styles.citiesSectionSubtitle}>{t.home.stateSectionSubtitle}</p>
            </div>
          </div>

          {/* Search and Filters Controls */}
          <div className={styles.stateControls}>
            <input
              type="text"
              placeholder={t.home.stateSearchPlaceholder}
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className={styles.stateSearchInput}
            />
            <div className={styles.stateFilterButtons}>
              <button
                type="button"
                onClick={() => setFilterMyState(f => !f)}
                className={`${styles.filterBtn} ${filterMyState ? styles.filterBtnActive : ""}`}
                disabled={!userStateCode}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {lang === "es" ? "Mi Estado" : "My State"} ({geoLoading ? (lang === "es" ? "Detectando…" : "Detecting…") : (userStateCode || (lang === "es" ? "Desconocido" : "Unknown"))})
              </button>
              <button
                type="button"
                onClick={() => setSortByHighestRisk(s => !s)}
                className={`${styles.filterBtn} ${sortByHighestRisk ? styles.filterBtnActive : ""}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                {lang === "es" ? "Mayor Riesgo Primero" : "Highest Risk First"}
              </button>
            </div>
          </div>

          {/* Grid of States */}
          <div className={styles.statesGrid}>
            {filteredStates.slice(0, showAllStates ? undefined : 12).map(state => {
              const barColor =
                state.riskPercent >= 20 ? "#A63D2F"
                : state.riskPercent >= 12 ? "#C07A2A"
                : "#4A7C59";

              const trendSymbol = state.trend === "up" ? "↑" : state.trend === "down" ? "↓" : "→";
              const trendClass =
                state.trend === "up" ? styles.trendUp
                : state.trend === "down" ? styles.trendDown
                : styles.trendStable;

              return (
                <div
                  key={state.code}
                  onClick={() => handlePillClick(`${state.name}, USA`)}
                  className={styles.stateCard}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handlePillClick(`${state.name}, USA`);
                    }
                  }}
                >
                  <div className={styles.stateCardHeader}>
                    <span className={styles.stateName}>{state.name}</span>
                    <span className={styles.stateCodeBadge}>{state.code}</span>
                  </div>
                  <div className={styles.stateRiskScoreRow}>
                    <span className={styles.stateRiskPercent} style={{ color: barColor }}>
                      {state.riskPercent}% {t.home.stateRiskLabel}
                    </span>
                    <span className={`${styles.stateTrendArrow} ${trendClass}`} title={`Trend: ${state.trend}`}>
                      {trendSymbol}
                    </span>
                  </div>
                  <div className={styles.statePopContext}>
                    {t.home.stateContextTemplate
                      .replace("{pre1986Percent}", String(state.pre1986Percent))
                      .replace("{populationAffected}", state.populationAffected)}
                  </div>
                  <div className={styles.stateCardBarBg}>
                    <div
                      className={styles.stateCardBarFill}
                      style={{
                        width: `${state.riskPercent * 3}%`, // Scale visually
                        maxWidth: "100%",
                        backgroundColor: barColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStates.length > 12 && (
            <div className={styles.showMoreContainer}>
              <button
                type="button"
                onClick={() => setShowAllStates(s => !s)}
                className={styles.showMoreBtn}
              >
                {showAllStates 
                  ? t.home.showLess 
                  : (t.home.showAllStates ? t.home.showAllStates.replace("{count}", String(filteredStates.length)) : `Show All ${filteredStates.length} States`)}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Public Accountability Hub Section ── */}
      <section className={styles.accountabilitySection}>
        <div className={styles.accountabilityContainer}>
          <div className={styles.accountabilityHeader}>
            <h2 className={styles.accountabilityTitle}>{t.home.accountabilityTitle}</h2>
            <p className={styles.accountabilitySubtitle}>
              {t.home.accountabilitySubtitle}
            </p>
          </div>

          {/* Live Recent Reports Ticker */}
          <div className={styles.tickerWrapper}>
            <span className={styles.tickerHeader}>{t.home.tickerLive}</span>
            <div className={styles.tickerCarousel}>
              <div key={tickerIndex} className={styles.tickerCarouselItem} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {renderTickerIcon(tickerItems[tickerIndex]?.type)}
                <span>{tickerItems[tickerIndex]?.text}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.accountabilityGrid}>
            {/* Left Side: School Compliance Audits */}
            <div className={styles.hubCard}>
              <div className={styles.hubCardHeader}>
                <span className={styles.liveIndicatorGreen} />
                <h3 className={styles.hubCardTitle}>{t.home.hubSchoolTitle}</h3>
              </div>
              <p className={styles.hubCardDesc}>
                {t.home.hubSchoolDesc}
              </p>

              {/* School Search box */}
              <div className={styles.schoolSearchWrapper}>
                <input
                  type="text"
                  placeholder={t.home.hubSchoolSearch}
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className={styles.schoolSearchInput}
                />
              </div>
              
              <div className={styles.hubMockupTable}>
                <div className={styles.hubTableHeader}>
                  <span>{t.home.hubColFacility}</span>
                  <span>{t.home.hubColRisk}</span>
                  <span>{t.home.hubColStatus}</span>
                </div>
                {schoolsLoading ? (
                  [0,1,2].map(i => (
                    <div key={i} className={`${styles.hubTableRow} ${styles.skeletonRow}`}>
                      <span className={styles.skeletonCell} style={{ width: "55%" }} />
                      <span className={styles.skeletonCell} style={{ width: "15%" }} />
                      <span className={styles.skeletonCell} style={{ width: "20%" }} />
                    </div>
                  ))
                ) : schools && schools.length > 0 ? (
                  schools
                    .filter(s => s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()))
                    .map((s) => {
                      const risk = s.risk_level;
                      const cls = risk === "Low" ? styles.passStatus : risk === "Moderate" ? styles.pendingStatus : styles.exceededStatus;
                      const displayStatus = risk === "Low" ? t.home.compliancePass : risk === "Moderate" ? t.home.compliancePending : t.home.complianceExceeded;
                      return (
                        <div key={s.place_id} className={styles.hubTableRow}>
                          <span className={styles.hubSchoolName}>{s.name}</span>
                          <span className={styles.hubSchoolVal}>{s.score}/100</span>
                          <span className={`${styles.hubStatusBadge} ${cls}`}>{displayStatus}</span>
                        </div>
                      );
                    })
                ) : (
                  [
                    { name: "Lincoln Elementary School", val: "1.2 ppb", status: t.home.compliancePass, cls: styles.passStatus },
                    { name: "Cass Technical High School", val: "18.4 ppb", status: t.home.complianceExceeded, cls: styles.exceededStatus },
                    { name: "Cornerstone Charter Academy", val: "2.1 ppb", status: t.home.compliancePass, cls: styles.passStatus },
                  ]
                  .filter(s => s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()))
                  .map((s, idx) => (
                    <div key={idx} className={styles.hubTableRow}>
                      <span className={styles.hubSchoolName}>{s.name}</span>
                      <span className={styles.hubSchoolVal}>{s.val}</span>
                      <span className={`${styles.hubStatusBadge} ${s.cls}`}>{s.status}</span>
                    </div>
                  ))
                )}
              </div>
              <Link href="/schools" className={styles.hubButton}>
                {t.home.hubSchoolDirectory}
              </Link>
            </div>

            {/* Right Side: Landlord Compliance Tracker */}
            <div className={styles.hubCard}>
              <div className={styles.hubCardHeader}>
                <span className={styles.liveIndicatorRed} />
                <h3 className={styles.hubCardTitle}>{t.home.hubLandlordTitle}</h3>
              </div>
              <p className={styles.hubCardDesc}>
                {t.home.hubLandlordDesc}
              </p>
              
              <div className={styles.hubMockupTable}>
                <div className={styles.hubTableHeader}>
                  <span>{t.home.hubColLandlord}</span>
                  <span>{t.home.hubColProperty}</span>
                  <span>{t.home.hubColResponse}</span>
                </div>
                {landlordsLoading ? (
                  [0,1,2].map(i => (
                    <div key={i} className={`${styles.hubTableRow} ${styles.skeletonRow}`}>
                      <span className={styles.skeletonCell} style={{ width: "50%" }} />
                      <span className={styles.skeletonCell} style={{ width: "20%" }} />
                    </div>
                  ))
                ) : landlords && landlords.length > 0 ? (
                  landlords.map((l) => {
                    const resp = l.landlord_response;
                    const cls = resp === "REFUSED" || resp === "TESTED_POSITIVE" ? styles.exceededStatus
                      : resp === "PENDING" || resp === "NO_RESPONSE" ? styles.pendingStatus
                      : styles.agreedStatus;
                    
                    let label = "";
                    if (resp === "REFUSED") label = t.home.complianceRefused;
                    else if (resp === "TESTED_POSITIVE") label = t.home.complianceExceeded;
                    else if (resp === "PENDING" || resp === "NO_RESPONSE") label = t.home.compliancePending;
                    else if (resp === "AGREED_TO_TEST") label = t.home.complianceAgreed;
                    else if (resp === "TESTED_NEGATIVE") label = t.home.compliancePass;
                    else label = resp.replace(/_/g, " ");

                    return (
                      <div key={l.id} className={styles.hubTableRow}>
                        <div>
                          <span className={styles.hubLandlordName}>{l.management_company || l.landlord_name || "Anonymous"}</span>
                          <span className={styles.hubLandlordProp}>{l.property_address}</span>
                        </div>
                        <span className={`${styles.hubStatusBadge} ${cls}`}>{label}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.hubTableRow} style={{ justifyContent: "center", padding: "20px", color: "var(--color-gray)", fontSize: "14px" }}>
                    {t.home.hubLandlordEmpty}
                  </div>
                )}
              </div>
              <Link href="/accountability" className={styles.hubButton}>
                {t.home.hubTenantRegistry}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className={styles.methodologySection}>
        <div className={styles.methodologyContainer}>
          <div className={styles.methodologyLeft}>
            <h2 className={styles.methodologyTitle}>{t.home.modelHeadline}</h2>
            <p className={styles.methodologyBody}>
              {t.home.modelDesc}
            </p>
            
            {/* Visual SVG Diagram showing inputs -> model -> risk score */}
            <div className={styles.diagramContainer}>
              <div className={styles.diagramNode}>
                <div className={styles.diagramNodeHeader}>{t.home.modelInputs}</div>
                <div className={styles.diagramNodeList}>
                  <span>{t.home.modelAge}</span>
                  <span>{t.home.modelViolations}</span>
                  <span>{t.home.modelDemo}</span>
                </div>
              </div>
              <div className={styles.diagramArrow}>➔</div>
              <div className={styles.diagramNodeActive}>
                <div className={styles.diagramNodeHeader}>{t.home.modelTitle}</div>
                <div className={styles.diagramNodeList}>
                  <span>{t.home.modelBoosting}</span>
                  <span>{t.home.modelValidation}</span>
                </div>
              </div>
              <div className={styles.diagramArrow}>➔</div>
              <div className={styles.diagramNode}>
                <div className={styles.diagramNodeHeader}>{t.home.modelScore}</div>
                <div className={styles.diagramNodeList}>
                  <span>{t.home.modelAdvisory}</span>
                  <span>{t.home.modelAction}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              <Link href="/data" className={styles.methodologyLink}>
                Explore the data page →
              </Link>
              <Link href="/methodology" className={styles.methodologyLink}>
                {t.home.modelReadPaper}
              </Link>
            </div>
          </div>

          <div className={styles.methodologyRight}>
            <div className={styles.sourcesLabel}>{t.home.modelSources}</div>
            <div className={styles.sourcesGrid}>
              <a href="https://www.census.gov/programs-surveys/acs" target="_blank" rel="noreferrer" className={styles.sourcePillLink}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceAcs}
              </a>
              <a href="https://www.epa.gov/enviro/sdwis-overview" target="_blank" rel="noreferrer" className={styles.sourcePillLink}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceEpa}
              </a>
              <a href="https://www.epa.gov/ground-water-and-drinking-water/lead-service-line-replacement-resources" target="_blank" rel="noreferrer" className={styles.sourcePillLink}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceLsl}
              </a>
              <span className={styles.sourcePillLinkDisabled}>
                <span className={styles.telemetryDot}></span>
                {t.home.sourceParcel}
              </span>
              <span className={styles.sourcePillLinkDisabled}>
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
            <div className={styles.citiesEyebrow}>{t.home.apiEyebrow}</div>
            <h2 className={styles.apiTitle}>{t.home.apiPlaygroundTitle}</h2>
            <p className={styles.apiBody}>
              {t.home.apiPlaygroundDesc}
            </p>
            
            {/* Interactive Form for Playground */}
            <form onSubmit={handleApiPlaygroundSubmit} className={styles.apiPlaygroundForm}>
              <input
                type="text"
                value={apiAddress}
                onChange={(e) => setApiAddress(e.target.value)}
                className={styles.apiPlaygroundInput}
                placeholder={t.home.apiPlaceholder}
                required
              />
              <button type="submit" className={styles.apiPlaygroundButton} disabled={apiLoading}>
                {apiLoading ? t.home.apiExecuting : t.home.apiRunQuery}
              </button>
            </form>

            <Link href="/api-docs" className={styles.apiLink} data-testid="home-api-link">
              {t.home.apiDocumentation}
            </Link>

            {/* Backed / Used by badges */}
            <div className={styles.apiBadgesRow}>
              <span className={styles.apiBadgeLabel}>{t.home.apiIntegratedBy}</span>
              <div className={styles.apiBadges}>
                <span className={styles.apiClientBadge}>SafeWater Alliance</span>
                <span className={styles.apiClientBadge}>OpenData Labs</span>
                <span className={styles.apiClientBadge}>EcoInspect</span>
              </div>
            </div>
          </div>
          
          <div className={styles.apiTerminal}>
            <div className={styles.apiTerminalHeader}>
              <span className={styles.apiTerminalShell}>bash</span>
              <span className={styles.apiTerminalTitle}>GET /api/risk?address={encodeURIComponent(apiAddress)}</span>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className={styles.apiCopyBtn}
                title="Copy response to clipboard"
              >
                {copied ? t.home.apiCopied : t.home.apiCopy}
              </button>
            </div>
            <pre className={styles.apiTerminalCode}>
              <code>{apiResponse}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnimatedNumber({ value, suffix = "", duration = 1800 }: { value: string | number; suffix?: string; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Trigger animation only when scrolled into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const strVal = String(value);
    const numericPart = parseFloat(strVal.replace(/[^0-9.]/g, ""));
    if (isNaN(numericPart)) return;

    let startTimestamp: number | null = null;
    let rafId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * numericPart);
      if (progress < 1) rafId = window.requestAnimationFrame(step);
      else setCurrent(numericPart);
    };
    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [started, value, duration]);

  const formatted = (() => {
    const strVal = String(value);
    if (strVal.includes("M")) return `${current.toFixed(1)}M`;
    if (strVal.includes("%")) return `${Math.round(current)}%`;
    if (strVal.includes(",")) return Math.round(current).toLocaleString();
    if (strVal.includes("+")) return `${Math.round(current)}+`;
    return Math.round(current).toString();
  })();

  return <span ref={ref}>{formatted}{suffix}</span>;
}

interface StateRisk {
  name: string;
  code: string;
  riskPercent: number;
  pre1986Percent: number;
  populationAffected: string;
  trend: "up" | "down" | "stable";
}

const US_STATES_RISK: StateRisk[] = [
  { name: "Alabama", code: "AL", riskPercent: 12, pre1986Percent: 38, populationAffected: "~5.0M", trend: "down" },
  { name: "Alaska", code: "AK", riskPercent: 4, pre1986Percent: 15, populationAffected: "~730K", trend: "stable" },
  { name: "Arizona", code: "AZ", riskPercent: 6, pre1986Percent: 22, populationAffected: "~7.2M", trend: "down" },
  { name: "Arkansas", code: "AR", riskPercent: 9, pre1986Percent: 31, populationAffected: "~3.0M", trend: "down" },
  { name: "California", code: "CA", riskPercent: 8, pre1986Percent: 41, populationAffected: "~39M", trend: "down" },
  { name: "Colorado", code: "CO", riskPercent: 7, pre1986Percent: 29, populationAffected: "~5.8M", trend: "stable" },
  { name: "Connecticut", code: "CT", riskPercent: 18, pre1986Percent: 58, populationAffected: "~3.6M", trend: "down" },
  { name: "Delaware", code: "DE", riskPercent: 11, pre1986Percent: 42, populationAffected: "~1.0M", trend: "down" },
  { name: "Florida", code: "FL", riskPercent: 5, pre1986Percent: 25, populationAffected: "~22M", trend: "down" },
  { name: "Georgia", code: "GA", riskPercent: 7, pre1986Percent: 30, populationAffected: "~10.8M", trend: "stable" },
  { name: "Hawaii", code: "HI", riskPercent: 3, pre1986Percent: 12, populationAffected: "~1.4M", trend: "stable" },
  { name: "Idaho", code: "ID", riskPercent: 5, pre1986Percent: 19, populationAffected: "~1.9M", trend: "up" },
  { name: "Illinois", code: "IL", riskPercent: 24, pre1986Percent: 62, populationAffected: "~12.6M", trend: "down" },
  { name: "Indiana", code: "IN", riskPercent: 18, pre1986Percent: 48, populationAffected: "~6.8M", trend: "stable" },
  { name: "Iowa", code: "IA", riskPercent: 16, pre1986Percent: 45, populationAffected: "~3.2M", trend: "down" },
  { name: "Kansas", code: "KS", riskPercent: 12, pre1986Percent: 39, populationAffected: "~2.9M", trend: "down" },
  { name: "Kentucky", code: "KY", riskPercent: 14, pre1986Percent: 40, populationAffected: "~4.5M", trend: "stable" },
  { name: "Louisiana", code: "LA", riskPercent: 11, pre1986Percent: 35, populationAffected: "~4.6M", trend: "down" },
  { name: "Maine", code: "ME", riskPercent: 15, pre1986Percent: 52, populationAffected: "~1.4M", trend: "down" },
  { name: "Maryland", code: "MD", riskPercent: 14, pre1986Percent: 46, populationAffected: "~6.2M", trend: "down" },
  { name: "Massachusetts", code: "MA", riskPercent: 20, pre1986Percent: 68, populationAffected: "~7.0M", trend: "down" },
  { name: "Michigan", code: "MI", riskPercent: 22, pre1986Percent: 55, populationAffected: "~10M", trend: "down" },
  { name: "Minnesota", code: "MN", riskPercent: 15, pre1986Percent: 48, populationAffected: "~5.7M", trend: "stable" },
  { name: "Mississippi", code: "MS", riskPercent: 10, pre1986Percent: 33, populationAffected: "~2.9M", trend: "down" },
  { name: "Missouri", code: "MO", riskPercent: 17, pre1986Percent: 46, populationAffected: "~6.2M", trend: "stable" },
  { name: "Montana", code: "MT", riskPercent: 8, pre1986Percent: 28, populationAffected: "~1.1M", trend: "up" },
  { name: "Nebraska", code: "NE", riskPercent: 13, pre1986Percent: 38, populationAffected: "~2.0M", trend: "down" },
  { name: "Nevada", code: "NV", riskPercent: 4, pre1986Percent: 18, populationAffected: "~3.1M", trend: "stable" },
  { name: "New Hampshire", code: "NH", riskPercent: 14, pre1986Percent: 49, populationAffected: "~1.4M", trend: "down" },
  { name: "New Jersey", code: "NJ", riskPercent: 19, pre1986Percent: 59, populationAffected: "~9.3M", trend: "down" },
  { name: "New Mexico", code: "NM", riskPercent: 5, pre1986Percent: 21, populationAffected: "~2.1M", trend: "stable" },
  { name: "New York", code: "NY", riskPercent: 21, pre1986Percent: 65, populationAffected: "~19.7M", trend: "down" },
  { name: "North Carolina", code: "NC", riskPercent: 8, pre1986Percent: 32, populationAffected: "~10.5M", trend: "down" },
  { name: "North Dakota", code: "ND", riskPercent: 6, pre1986Percent: 24, populationAffected: "~780K", trend: "stable" },
  { name: "Ohio", code: "OH", riskPercent: 20, pre1986Percent: 52, populationAffected: "~11.8M", trend: "down" },
  { name: "Oklahoma", code: "OK", riskPercent: 9, pre1986Percent: 30, populationAffected: "~4.0M", trend: "down" },
  { name: "Oregon", code: "OR", riskPercent: 6, pre1986Percent: 28, populationAffected: "~4.2M", trend: "stable" },
  { name: "Pennsylvania", code: "PA", riskPercent: 21, pre1986Percent: 60, populationAffected: "~13.0M", trend: "down" },
  { name: "Rhode Island", code: "RI", riskPercent: 22, pre1986Percent: 64, populationAffected: "~1.1M", trend: "down" },
  { name: "South Carolina", code: "SC", riskPercent: 9, pre1986Percent: 32, populationAffected: "~5.2M", trend: "down" },
  { name: "South Dakota", code: "SD", riskPercent: 8, pre1986Percent: 27, populationAffected: "~900K", trend: "up" },
  { name: "Tennessee", code: "TN", riskPercent: 11, pre1986Percent: 36, populationAffected: "~7.0M", trend: "down" },
  { name: "Texas", code: "TX", riskPercent: 6, pre1986Percent: 24, populationAffected: "~30M", trend: "down" },
  { name: "Utah", code: "UT", riskPercent: 4, pre1986Percent: 18, populationAffected: "~3.3M", trend: "up" },
  { name: "Vermont", code: "VT", riskPercent: 13, pre1986Percent: 47, populationAffected: "~640K", trend: "down" },
  { name: "Virginia", code: "VA", riskPercent: 12, pre1986Percent: 40, populationAffected: "~8.6M", trend: "down" },
  { name: "Washington", code: "WA", riskPercent: 7, pre1986Percent: 30, populationAffected: "~7.8M", trend: "stable" },
  { name: "West Virginia", code: "WV", riskPercent: 15, pre1986Percent: 45, populationAffected: "~1.8M", trend: "down" },
  { name: "Wisconsin", code: "WI", riskPercent: 18, pre1986Percent: 50, populationAffected: "~5.9M", trend: "down" },
  { name: "Wyoming", code: "WY", riskPercent: 5, pre1986Percent: 20, populationAffected: "~580K", trend: "stable" }
];

