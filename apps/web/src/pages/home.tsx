import { useState, useEffect } from "react";
import { useGetStats } from "@workspace/api-client-react";
import SearchBar from "@/components/SearchBar";
import { featuredCities } from "@/lib/featuredCities";
import { useTranslation } from "@/hooks/useTranslation";
import { Link } from "wouter";
import styles from "../styles/home.module.css";

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

  return (
    <div className={styles.wrapper}>

      <section className={styles.hero}>
        <div className={styles.heroSplit}>
          <div className={styles.heroLeft}>
            <div className={styles.telemetryBadge}>
              <span className={styles.liveIndicator}></span>
              <strong>Index:</strong> {stats?.homes_at_risk ?? '9.2M'} homes at risk identified
            </div>
            <h1 className={styles.headline}>{t.home.headline}</h1>
            <p className={styles.heroBody}>{t.home.subtext}</p>
            <div className={styles.searchBarWrapper}>
              <SearchBar />
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroGraphicCard}>
              <img 
                src="/clean_home_water_graphic_1782610979792.png" 
                alt="Clean Home Tap Water Assessment" 
                className={styles.heroGraphic} 
              />
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
                <div className={`${styles.iconBadge} ${styles.badgeTeal}`}>
                  <svg className={styles.arsenalIcon} style={{ stroke: "#0D9488" }} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <h3 className={styles.arsenalCardTitle}>{t.home.toolFoiaTitle}</h3>
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
                <div className={`${styles.iconBadge} ${styles.badgeBlue}`}>
                  <svg className={styles.arsenalIcon} style={{ stroke: "#2563EB" }} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16" />
                    <path d="M20 15v-5h2V6H2v4h2v5" />
                    <path d="M12 2v4" />
                    <path d="M3 6h18" />
                    <path d="M9 10v5" />
                    <path d="M15 10v5" />
                  </svg>
                </div>
                <h3 className={styles.arsenalCardTitle}>{t.home.toolRepTitle}</h3>
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
                <div className={`${styles.iconBadge} ${styles.badgeOrange}`}>
                  <svg className={styles.arsenalIcon} style={{ stroke: "#EA580C" }} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
                  </svg>
                </div>
                <h3 className={styles.arsenalCardTitle}>{t.home.toolFilterTitle}</h3>
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
                <div className={`${styles.iconBadge} ${styles.badgePurple}`}>
                  <svg className={styles.arsenalIcon} style={{ stroke: "#7C3AED" }} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                </div>
                <h3 className={styles.arsenalCardTitle}>{t.home.toolKitTitle}</h3>
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

      <section className={styles.citiesSection}>
        <div className={styles.citiesContainer}>
          <div className={styles.citiesLabel}>{t.home.citiesLabel}</div>

          <div className={styles.citiesScroll}>
            {featuredCities.map(city => (
              <CityCard key={city.slug} city={city} />
            ))}
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

      <section className={styles.apiPromoSection}>
        <div className={styles.apiPromoContainer}>
          <h2 className={styles.apiPromoTitle}>{t.home.apiTitle}</h2>
          <p className={styles.apiPromoBody}>{t.home.apiBody}</p>
          <Link href="/api-docs" className={styles.apiPromoLink} data-testid="home-api-link">
            {t.home.apiLink}
          </Link>
        </div>
      </section>
    </div>
  );
}
