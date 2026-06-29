import React, { Suspense, useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { translateFactor, translateRiskLevel, translateSeverity } from "@/lib/translateRiskFactors";
import { checkRealEstateListing, type RealEstateResult } from "@/lib/realEstateApi";
import { useQuery } from "@tanstack/react-query";
import PediatricianLetter from "@/components/PediatricianLetter";
import LandlordLetter from "@/components/LandlordLetter";
import FreeFilterDemand from "@/components/FreeFilterDemand";
import AlertSubscription from "@/components/AlertSubscription";
import styles from "../styles/listing-result.module.css";
import SearchBar from "../components/SearchBar";
import { useGetNeighborhood, getGetNeighborhoodQueryKey } from "@workspace/api-client-react";
import type { Translations } from "@/lib/translations/types";
import { usePregnancyMode } from "@/hooks/usePregnancyMode";

const LeafletMap = React.lazy(() => import("@/components/map/leaflet-map"));
const NeighborhoodMap = React.lazy(() => import("@/components/map/neighborhood-map"));

const CIRCUMFERENCE = 2 * Math.PI * 54;

function getScoreColor(score: number): string {
  if (score >= 80) return "#7A1F0F";
  if (score >= 60) return "#A63D2F";
  if (score >= 40) return "#C07A2A";
  return "#4A7C59";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "0 0 25px rgba(122, 31, 15, 0.45)";
  if (score >= 60) return "0 0 25px rgba(166, 61, 47, 0.45)";
  if (score >= 40) return "0 0 25px rgba(192, 122, 42, 0.45)";
  return "0 0 25px rgba(74, 124, 89, 0.45)";
}

function ScoreRing({ score }: { score: number }) {
  const targetOffset = CIRCUMFERENCE * (1 - score / 100);
  const color = getScoreColor(score);
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className={styles.ring}>
      <circle cx="60" cy="60" r="54" fill="none" stroke="#E8E0D8" strokeWidth="8" />
      <circle
        cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={CIRCUMFERENCE} strokeLinecap="round"
        transform="rotate(-90 60 60)" className={styles.ringProgress}
        style={{ strokeDashoffset: targetOffset } as React.CSSProperties}
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#7A6F65" fontFamily="Inter, sans-serif">
        /100
      </text>
    </svg>
  );
}

type Severity = "HIGH" | "MODERATE" | "LOW" | "VERY HIGH";

const severityColors: Record<Severity, string> = {
  "VERY HIGH": "#7A1F0F",
  HIGH: "#A63D2F",
  MODERATE: "#C07A2A",
  LOW: "#4A7C59",
};

// ── Listing risk banner ──────────────────────────────────────────────────────

function ListingRiskBanner({ score }: { score: number }) {
  if (score >= 60) {
    return (
      <div className={`${styles.riskBanner} ${styles.riskBannerHigh}`}>
        <span className={styles.riskBannerIcon}>⚠️</span>
        <span className={styles.riskBannerText}>
          This listing is in a <strong>HIGH RISK</strong> lead pipe area. This should be disclosed and investigated before purchase.
        </span>
      </div>
    );
  }
  if (score >= 35) {
    return (
      <div className={`${styles.riskBanner} ${styles.riskBannerModerate}`}>
        <span className={styles.riskBannerIcon}>⚡</span>
        <span className={styles.riskBannerText}>
          This listing shows <strong>MODERATE</strong> lead pipe risk. Request water testing records from the seller before closing.
        </span>
      </div>
    );
  }
  return (
    <div className={`${styles.riskBanner} ${styles.riskBannerLow}`}>
      <span className={styles.riskBannerIcon}>✓</span>
      <span className={styles.riskBannerText}>
        This listing shows <strong>LOW</strong> lead pipe risk based on available data. Standard precautions apply.
      </span>
    </div>
  );
}

// ── Share with your realtor button ────────────────────────────────────────────

function ShareRealtorButton({ data, pageUrl }: { data: RealEstateResult; pageUrl: string }) {
  const [copied, setCopied] = useState(false);

  const riskLevelText = data.risk_level;
  const message = `I ran this listing through Plumbum, an open-source lead pipe risk tool built on EPA and Census data. The property at ${data.geocoded_address || data.extracted_address} received a risk score of ${Math.round(data.score)}/100 — ${riskLevelText}. Full report: ${pageUrl}. I'd like to request documentation of any lead pipe testing or replacement at this property before proceeding.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = message;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      id="share-with-realtor-button"
      className={`${styles.shareBtn} ${copied ? styles.copied : ""}`}
      onClick={handleCopy}
      type="button"
    >
      {copied ? "✓ Copied to clipboard!" : "📋 Share with your realtor"}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function NeighborhoodHeatmapSection({ lat, lng, t }: { lat: number; lng: number; t: Translations }) {
  const { data: points, isLoading, isError } = useGetNeighborhood(
    { lat, lng },
    { query: { enabled: !!lat && !!lng, queryKey: getGetNeighborhoodQueryKey({ lat, lng }) } }
  );

  return (
    <section className={styles.mapSection} style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#8E8883", fontWeight: 600, letterSpacing: "0.05em" }}>
          {t.result.neighborhoodLabel}
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1A1614", marginTop: "4px" }}>
          {t.result.neighborhoodHeadline}
        </h2>
      </div>

      <div style={{ height: "500px", width: "100%", background: "#1C1917", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
        {isLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(28, 25, 23, 0.7)", zIndex: 10, color: "#D1CFC7", fontSize: "14px" }}>
            Loading neighborhood map...
          </div>
        )}
        {isError && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(28, 25, 23, 0.7)", zIndex: 10, color: "#EF4444", fontSize: "14px" }}>
            Failed to load neighborhood map data
          </div>
        )}
        {!isLoading && !isError && points && (
          <Suspense fallback={<div style={{ height: "500px", background: "#1C1917" }} />}>
            <NeighborhoodMap lat={lat} lng={lng} geoJson={points} />
          </Suspense>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px", fontSize: "12px", color: "#7A6F65" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#4A7C59", borderRadius: "2px" }} />
          <span>{t.riskLevels.low}</span>
        </div>
        <span>·</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#C07A2A", borderRadius: "2px" }} />
          <span>{t.riskLevels.moderate}</span>
        </div>
        <span>·</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#A63D2F", borderRadius: "2px" }} />
          <span>{t.riskLevels.high}</span>
        </div>
        <span>·</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#7A1F0F", borderRadius: "2px" }} />
          <span>{t.riskLevels.veryHigh}</span>
        </div>
      </div>
    </section>
  );
}

export default function ListingResult() {
  const { t, lang } = useTranslation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const listingUrl = searchParams.get("url") || "";

  const pageUrl = window.location.href;
  const locale = lang === "es" ? "es-US" : "en-US";

  const [animatedScore, setAnimatedScore] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { isPregnant, setIsPregnant } = usePregnancyMode();
  const [housingStatus, setHousingStatus] = useState<"own" | "rent" | null>(null);
  const [activeTab, setActiveTab] = useState<"peds" | "landlord" | "free-filter" | "subsidy">("free-filter");

  const {
    data: listing,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["real-estate", listingUrl],
    queryFn: () => checkRealEstateListing(listingUrl),
    enabled: !!listingUrl,
    retry: false,
  });

  const score = listing ? Math.round(listing.score) : 0;
  const riskLevel = listing?.risk_level ?? "";
  const riskLevelLabel = riskLevel ? translateRiskLevel(riskLevel, t) : "";

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";

  const { data: ccrTranslation, isLoading: ccrLoading } = useQuery({
    queryKey: ["ccr-translation-listing", listing?.geocoded_address, score],
    queryFn: async () => {
      const url = new URL("/api/ccr/translate", window.location.origin);
      url.searchParams.set("address", listing?.geocoded_address || listing?.extracted_address || "");
      url.searchParams.set("city", listing?.geocoded_address?.split(",")[0]?.trim() || "");
      url.searchParams.set("state", listing?.census_tract?.slice(0, 2) || "");
      url.searchParams.set("score", String(score));
      url.searchParams.set("violations", String(listing?.epa_violations_10yr ?? 0));
      url.searchParams.set("pctPre1986", String(listing?.pct_pre1986 ?? 0));
      url.searchParams.set("waterDistrict", (listing as any)?.public_pws || "");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to translate CCR");
      return res.json() as Promise<{ summary: string }>;
    },
    enabled: !!listing,
  });

  const { data: points } = useGetNeighborhood(
    { lat: listing?.lat ?? 0, lng: listing?.lng ?? 0 },
    { query: { enabled: !!listing?.lat && !!listing?.lng, queryKey: getGetNeighborhoodQueryKey({ lat: listing?.lat ?? 0, lng: listing?.lng ?? 0 }) } }
  );

  const { data: subsidyData, isLoading: subsidyLoading } = useQuery({
    queryKey: ["subsidy-finder-listing", listing?.geocoded_address, score],
    queryFn: async () => {
      const cityPart = listing?.geocoded_address?.split(",")[0]?.trim() || "";
      const statePart = listing?.census_tract?.slice(0, 2) || "";
      const url = new URL("/api/subsidy/find", window.location.origin);
      url.searchParams.set("city", cityPart);
      url.searchParams.set("state", statePart);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to find subsidy");
      return res.json() as Promise<{ summary: string }>;
    },
    enabled: !!listing && housingStatus === "own",
  });

  useEffect(() => {
    if (housingStatus === "rent") {
      setActiveTab("free-filter");
    } else if (housingStatus === "own") {
      setActiveTab("subsidy");
    }
  }, [housingStatus]);

  // Animate score count-up from 0 to final score over 1200ms using ease-out
  useEffect(() => {
    if (!listing) return;
    let startTime: number | null = null;
    const duration = 1200;
    const startValue = 0;
    const endValue = score;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = progress * (2 - progress);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setAnimatedScore(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [listing, score]);

  // Inject style block for printing on mount and clean up on unmount
  useEffect(() => {
    const style = document.createElement("style");
    style.media = "print";
    style.innerHTML = `
      @page {
        margin: 2cm;
        @bottom-center {
          content: "Plumbum · plumbum.io · Data: EPA, Census, USGS";
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #000000;
        }
      }
      nav,
      footer,
      header,
      .${styles.alertBanner},
      .${styles.disclaimer},
      .${styles.realtorActions},
      .${styles.listingSection},
      .${styles.shareStrip},
      .${styles.footer},
      .${styles.backLink},
      .backLink,
      .${styles.mapSection},
      .mapSection,
      .${styles.copyAddressBtn},
      .${styles.bottomSearchSection},
      button,
      input,
      .print-hidden {
        display: none !important;
      }
      body, html, .${styles.wrapper}, .${styles.container} {
        background: #ffffff !important;
        color: #000000 !important;
      }
      * {
        background: transparent !important;
        color: #000000 !important;
        border-color: transparent !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }
      .${styles.factorPanel} {
        border-left: 2px solid #000000 !important;
        padding-left: 24px !important;
        page-break-inside: avoid;
      }
      .${styles.factorBarTrack} {
        background: #EDE3DA !important;
      }
      .${styles.factorBarFill} {
        background: #000000 !important;
      }
      .${styles.ring} circle:first-of-type {
        stroke: #EDE3DA !important;
      }
      .${styles.ring} circle:last-of-type {
        stroke: #000000 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const displayScore = Math.round(animatedScore);
  const displayColor = getScoreColor(animatedScore);
  const displayGlow = getScoreGlow(animatedScore);

  return (
    <div className={`${styles.wrapper} ${isPregnant ? styles.pregnancyModeActive : ""}`}>
      {/* Loading */}
      {isLoading && (
        <div className={styles.loadingState}>
          <div className="terminal-loader-box">
            [ SCANNING LISTING AND RUNNING RISK ASSESSMENT… ]
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className={styles.errorState}>
          <h2>Couldn't analyze this listing</h2>
          <p>{errorMessage}</p>
          <Link href="/" className={styles.backLink}>← Back to search</Link>
        </div>
      )}

      {/* Result */}
      {listing && (
        <>
          {/* ── Listing Analysis section ── */}
          <section className={styles.listingSection}>
            <div className={styles.listingInner}>
              <Link href="/" className={styles.backLink}>← Back to search</Link>
              <div className={styles.listingLabel}>Listing Analysis</div>
              <div className={styles.listingTitle}>
                {listing.geocoded_address || listing.extracted_address}
              </div>
              <div className={styles.listingSourceUrl}>
                Source: <a href={listing.url} target="_blank" rel="noreferrer">{listing.url}</a>
              </div>

              <ListingRiskBanner score={score} />

              <div className={styles.realtorActions}>
                <ShareRealtorButton data={listing} pageUrl={pageUrl} />
              </div>

              <div className={styles.disclaimer}>
                <strong>Disclosure:</strong> Plumbum's risk assessment does not constitute a property inspection. Always request a certified lead inspection before purchasing any home built before 1986.
              </div>
            </div>
          </section>

          {/* ── Standard alert banner ── */}
          {score >= 60 ? (
            <div className={styles.alertBanner} style={{ background: score >= 80 ? "#7A1F0F" : "#A63D2F" }}>
              <span>
                {score >= 80
                  ? t.result.alertVeryHigh
                  : t.result.alertHigh}{" "}
                <a href="https://www.epa.gov/ground-water-and-drinking-water/get-your-water-tested" target="_blank" rel="noreferrer" className={styles.alertLink}>
                  {t.result.getFreeTestKit}
                </a>
              </span>
            </div>
          ) : score >= 40 ? (
            <div className={styles.alertBanner} style={{ background: "#C07A2A" }}>
              <span>
                {t.result.alertModerate}{" "}
                <a href="https://www.epa.gov/ground-water-and-drinking-water/get-your-water-tested" target="_blank" rel="noreferrer" className={styles.alertLink}>
                  {t.result.learnMore}
                </a>
              </span>
            </div>
          ) : (
            <div className={styles.alertBanner} style={{ background: "#4A7C59" }}>
              <span>{t.result.alertLow}</span>
            </div>
          )}

          {/* ── Score + address ── */}
          <section className={styles.topSection}>
            <div className={styles.container}>
              <div className={styles.addressMetaRow}>
                <span className={styles.sectionMeta}>{t.result.addressAnalyzed}</span>
                <button
                  className={styles.copyAddressBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(listing.geocoded_address || listing.extracted_address);
                    setCopiedAddress(true);
                    setTimeout(() => setCopiedAddress(false), 1500);
                  }}
                  title="Copy address"
                  type="button"
                >
                  {copiedAddress ? (
                    <span className={styles.copiedText}>✓ Copied</span>
                  ) : (
                    <svg className={styles.copyAddressIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.addressLabel}>
                {listing.geocoded_address || listing.extracted_address}
              </div>

              <div className={styles.topLayoutGrid}>
                <div className={styles.topLayoutMain}>
                  <div className={styles.heroRow}>
                    <div className={styles.heroLeft}>
                      <div className={styles.sectionMeta}>{t.result.riskScore}</div>
                      <div className={styles.heroScore}>
                        <div
                          className={styles.scoreNum}
                          style={{ color: displayColor, textShadow: displayGlow }}
                        >
                          {displayScore}
                        </div>
                        <ScoreRing score={animatedScore} />
                      </div>
                      <div className={styles.riskLevel} style={{ color: getScoreColor(score) }}>
                        {riskLevelLabel} {t.result.riskSuffix}
                      </div>
                    </div>
                  </div>

                  {/* Renter vs. Owner Split Path */}
                  <div className={styles.housingToggleTop}>
                    <span className={styles.housingToggleLabel}>Are you a renter or owner of this property?</span>
                    <div className={styles.housingRadioGroup}>
                      <button
                        type="button"
                        className={`${styles.housingBtn} ${housingStatus === "rent" ? styles.housingBtnActive : ""}`}
                        onClick={() => setHousingStatus("rent")}
                      >
                        I Rent This Property
                      </button>
                      <button
                        type="button"
                        className={`${styles.housingBtn} ${housingStatus === "own" ? styles.housingBtnActive : ""}`}
                        onClick={() => setHousingStatus("own")}
                      >
                        I Own This Property
                      </button>
                    </div>
                  </div>
                </div>

                {/* CCR Translation Card (Auto-Summarized via Groq) */}
                <div className={styles.ccrCard}>
                  <div className={styles.ccrHeader}>
                    <span className={styles.ccrTitle}>EPA Water Quality Summary</span>
                    <span className={styles.ccrBadge}>AI Translated via Groq</span>
                  </div>
                  {ccrLoading ? (
                    <div className={styles.ccrSkeleton}>
                      <div className={styles.ccrSkeletonLine} />
                      <div className={styles.ccrSkeletonLine} />
                      <div className={styles.ccrSkeletonLine} />
                    </div>
                  ) : (
                    <div className={styles.ccrBody}>
                      {ccrTranslation?.summary ? (
                        ccrTranslation.summary.split("\n").map((line: string, idx: number) => {
                          const clean = line.replace(/^-\s*/, "");
                          if (!clean.trim()) return null;
                          return (
                            <div key={idx} className={styles.ccrBullet}>
                              <span className={styles.ccrBulletIcon}>•</span>
                              <p className={styles.ccrBulletText}>{clean}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className={styles.ccrError}>No water report summary available.</p>
                      )}
                    </div>
                  )}
                  <div className={styles.ccrFooter}>
                    <a href={(listing as any).ccr_url || "https://www.epa.gov/ccr"} target="_blank" rel="noreferrer" className={styles.ccrLink}>
                      View official PDF report ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Map ── */}
          <section className={styles.mapSection}>
            <div className={styles.mapContainer}>
              <Suspense fallback={<div className={styles.mapPlaceholder} />}>
                <LeafletMap lat={listing.lat} lng={listing.lng} zoom={15} interactive={true} hideOverlays={true} neighborhoodGeoJson={points} />
              </Suspense>
            </div>
          </section>

          <section className={styles.extensionPromoSection}>
            <div className={styles.container}>
              <div className={styles.extensionPromoCard}>
                <div className={styles.extensionPromoInfo}>
                  <span className={styles.extensionPromoBadge}>🔌 Free Chrome Extension</span>
                  <h3 className={styles.extensionPromoTitle}>Check lead pipe risk on Zillow & Redfin</h3>
                  <p className={styles.extensionPromoDesc}>The Plumbum Chrome extension automatically overlays EPA-backed risk badges directly on real estate listing pages.</p>
                </div>
                <Link href="/extension" className={styles.extensionPromoBtn}>
                  Install Extension
                </Link>
              </div>
            </div>
          </section>

          {/* ── Data section ── */}
          <section className={styles.dataSection}>
            <div className={styles.container}>
              <div className={styles.columns}>
                <div className={styles.leftCol}>
                  <div className={styles.sectionMeta}>{t.result.riskFactors}</div>
                  <h2 className={styles.colHeadline}>{t.result.whatWeFound}</h2>
                  <hr className={styles.colDivider} />
                  <div className={styles.factorList}>
                    {listing.factors?.map((factor: RealEstateResult["factors"][number], i: number) => {
                      const parsed = translateFactor(factor, t, lang);
                      const severityKey = (factor?.severity ?? "MODERATE") as Severity;
                      const fillPct = Math.max(8, (Number(factor?.score ?? 0) / Number(factor?.max ?? 25)) * 100);
                      return (
                        <div key={i} className={styles.factorPanel}>
                          <div className={styles.factorHeader}>
                            <h3 className={styles.factorTitle}>{parsed.title}</h3>
                            <span
                              className={styles.severityPill}
                              style={{
                                background: severityColors[severityKey] + "1A",
                                color: severityColors[severityKey],
                                borderColor: severityColors[severityKey] + "40",
                              }}
                            >
                              {translateSeverity(severityKey, t)}
                            </span>
                          </div>
                          <div className={styles.factorBarWrap}>
                            <div className={styles.factorBarTrack}>
                              <div
                                className={styles.factorBarFill}
                                style={{ width: `${fillPct}%`, background: severityColors[severityKey] }}
                              />
                            </div>
                            <span className={styles.factorBarValue}>
                              {Number(factor?.score ?? 0)}/{Number(factor?.max ?? 25)}
                            </span>
                          </div>
                          <p className={styles.factorExplanation}>{parsed.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className={styles.factorNote}>{t.result.factorNote}</p>
                </div>

                <div className={styles.rightCol}>
                  <div className={styles.sectionMeta}>{t.result.locationDossier}</div>
                  <h2 className={styles.colHeadline}>{t.result.censusTract}</h2>
                  <hr className={styles.colDivider} />
                  <div className={styles.tractGrid}>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.fipsCode}</div>
                      <div className={styles.dataValue}>
                        {listing.census_tract || <span className={styles.dataEmpty}>{t.result.notReported}</span>}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.medianBuildYear}</div>
                      <div className={styles.dataValue}>
                        {(listing as any).median_build_year ?? <span className={styles.dataEmpty}>{t.result.notReported}</span>}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.waterDistrict}</div>
                      <div className={styles.dataValue}>{t.result.publicPws}</div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.epaViolations}</div>
                      <div className={styles.dataValue}>
                        {listing.epa_violations_10yr ?? (score > 60 ? "2" : score > 40 ? "1" : "0")}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.medianIncome}</div>
                      <div className={styles.dataValue}>
                        {listing.median_income
                          ? `$${Number(listing.median_income).toLocaleString(locale)}`
                          : <span className={styles.dataEmpty}>{t.result.notReported}</span>}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.pre1986Housing}</div>
                      <div className={styles.dataValue}>
                        {listing.pct_pre1986
                          ? `${listing.pct_pre1986}%`
                          : <span className={styles.dataEmpty}>{t.result.notReported}</span>}
                      </div>
                    </div>
                  </div>
                  <p className={styles.tractNote}>{t.result.tractNoteUs}</p>
                  <p className={styles.lastUpdatedTimestamp}>
                    Data last updated: EPA SDWIS March 2024 · Census ACS 2022.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Unified "Take Action" tabbed section ── */}
          <section className={styles.takeActionSection} style={{ borderTop: "1px solid #D6CFC8", paddingTop: "32px", marginTop: "32px" }}>
            <div className={styles.container}>
              <div className={styles.takeActionMeta}>Take Action</div>
              <h2 className={styles.takeActionHeadline}>Protect yourself and your family</h2>

              {housingStatus === null ? (
                <div className={styles.actionNudge} style={{ border: "1px dashed #D6CFC8", padding: "24px", textAlign: "center" }}>
                  Please select your renter or owner status at the top of the page to generate customizable action letters.
                </div>
              ) : (
                <>
                  {/* Flat tab menu */}
                  <div className={styles.tabMenu} role="tablist">
                    {housingStatus === "own" && (
                      <button
                        id="tab-subsidy"
                        role="tab"
                        aria-selected={activeTab === "subsidy"}
                        aria-controls="tabpanel-subsidy"
                        className={`${styles.tabBtn} ${activeTab === "subsidy" ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab("subsidy")}
                        type="button"
                      >
                        Find Local Subsidy
                      </button>
                    )}
                    <button
                      id="tab-free-filter"
                      role="tab"
                      aria-selected={activeTab === "free-filter"}
                      aria-controls="tabpanel-free-filter"
                      className={`${styles.tabBtn} ${activeTab === "free-filter" ? styles.tabBtnActive : ""}`}
                      onClick={() => setActiveTab("free-filter")}
                      type="button"
                    >
                      Claim Free Filter
                    </button>
                    {housingStatus === "rent" && (
                      <button
                        id="tab-landlord"
                        role="tab"
                        aria-selected={activeTab === "landlord"}
                        aria-controls="tabpanel-landlord"
                        className={`${styles.tabBtn} ${activeTab === "landlord" ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab("landlord")}
                        type="button"
                      >
                        Notify Landlord
                      </button>
                    )}
                    <button
                      id="tab-peds"
                      role="tab"
                      aria-selected={activeTab === "peds"}
                      aria-controls="tabpanel-peds"
                      className={`${styles.tabBtn} ${activeTab === "peds" ? styles.tabBtnActive : ""}`}
                      onClick={() => setActiveTab("peds")}
                      type="button"
                    >
                      {isPregnant ? "OB/GYN Blood Test Request" : "Pediatrician Blood Test Request"}
                    </button>
                  </div>

                  {/* Landlord tab panel */}
                  {housingStatus === "rent" && (
                    <div
                      id="tabpanel-landlord"
                      role="tabpanel"
                      aria-labelledby="tab-landlord"
                      className={`${styles.tabPanel} ${activeTab === "landlord" ? styles.tabPanelActive : ""}`}
                    >
                      <LandlordLetter
                        address={listing.geocoded_address || listing.extracted_address}
                        score={score}
                        riskLevel={listing.risk_level}
                        factors={(listing.factors ?? []).map(f => ({
                          name: f.name,
                          detail: f.detail,
                          score: Number(f.score),
                          max: Number(f.max),
                        }))}
                        censusTract={listing.census_tract ?? ""}
                      />
                    </div>
                  )}

                  {/* Claim Free Filter tab panel */}
                  <div
                    id="tabpanel-free-filter"
                    role="tabpanel"
                    aria-labelledby="tab-free-filter"
                    className={`${styles.tabPanel} ${activeTab === "free-filter" ? styles.tabPanelActive : ""}`}
                  >
                    <FreeFilterDemand
                      address={listing.geocoded_address || listing.extracted_address}
                      pwsName={(listing as any)?.public_pws || ""}
                    />
                  </div>

                  {/* Find Local Subsidy tab panel */}
                  {housingStatus === "own" && (
                    <div
                      id="tabpanel-subsidy"
                      role="tabpanel"
                      aria-labelledby="tab-subsidy"
                      className={`${styles.tabPanel} ${activeTab === "subsidy" ? styles.tabPanelActive : ""}`}
                    >
                      <section className={styles.section} style={{ background: "#FEFCF9", padding: "48px 0" }}>
                        <div className={styles.container} style={{ maxWidth: "800px", margin: "0 auto" }}>
                          <div className={styles.sectionMeta} style={{ color: "#a63d2f", fontWeight: 700 }}>FINANCIAL AID</div>
                          <h2 className={styles.heading} style={{ fontSize: "28px", fontWeight: 700, margin: "10px 0 20px" }}>Local LSLR Subsidy Finder</h2>
                          <p className={styles.body} style={{ color: "#5A5550", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                            Digging up a lead service line costs between $5,000 and $10,000. Homeowners own the "private side" of the pipe (from the curb to the house).
                            We scanned federal, state, and city-level records to find replacement grants or interest-free loan programs for your municipality.
                          </p>

                          <div style={{
                            background: "#FAF9F6",
                            border: "1.5px solid var(--color-border)",
                            padding: "24px",
                            borderRadius: "4px",
                            fontFamily: "Inter, sans-serif"
                          }}>
                            {subsidyLoading ? (
                              <div style={{ fontStyle: "italic", color: "#7A6F65" }}>Searching city LSLR subsidy database...</div>
                            ) : subsidyData?.summary ? (
                              <div style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--color-text)" }}>
                                {subsidyData.summary.split("\n").filter((l: string) => l.trim().length > 0).map((line: string, idx: number) => {
                                  if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
                                    return (
                                      <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                                        <span style={{ color: "#a63d2f", fontSize: "18px", lineHeight: "1" }}>•</span>
                                        <span>
                                          {line.replace(/^[-*]\s*/, "").split("**").map((part: string, pIdx: number) => 
                                            pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: "#1A1614", fontWeight: 700 }}>{part}</strong> : part
                                          )}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return <p key={idx} style={{ marginBottom: "12px" }}>{line}</p>;
                                })}
                              </div>
                            ) : (
                              <div style={{ color: "#7A6F65" }}>
                                No specific program was found for your city. Please contact your local water utility to check for State Revolving Fund (SRF) grant availability.
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {/* Pediatrician tab panel */}
                  <div
                    id="tabpanel-peds"
                    role="tabpanel"
                    aria-labelledby="tab-peds"
                    className={`${styles.tabPanel} ${activeTab === "peds" ? styles.tabPanelActive : ""}`}
                  >
                    <PediatricianLetter
                      address={listing.geocoded_address || listing.extracted_address}
                      score={score}
                      riskLevel={listing.risk_level}
                      factors={(listing.factors ?? []).map(f => ({
                        name: f.name,
                        detail: f.detail,
                        score: Number(f.score),
                        max: Number(f.max),
                      }))}
                      censusTract={listing.census_tract ?? ""}
                      pctPre1986={listing.pct_pre1986 ?? null}
                      isPregnant={isPregnant}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={styles.bottomSearchSection}>
            <div className={styles.container}>
              <div className={styles.bottomSearchLabel}>CHECK ANOTHER ADDRESS</div>
              <SearchBar size="small" hideUrlForm={true} />
            </div>
          </section>

          {/* ── Share strip ── */}
          <section className={styles.shareStrip}>
            <div className={styles.container}>
              <div className={styles.shareLabel}>{t.result.shareLabel}</div>
              <div className={styles.shareBox}>
                <input type="text" readOnly value={pageUrl} className={styles.shareInput} />
                <button
                  className={styles.copyBtn}
                  onClick={() => navigator.clipboard.writeText(pageUrl)}
                  type="button"
                >
                  {t.result.copyLink}
                </button>
              </div>
            </div>
          </section>

          <AlertSubscription
            address={listing.geocoded_address || listing.extracted_address}
            score={score}
            censusTract={listing.census_tract ?? ""}
          />

          <footer className={styles.footer}>
            <div className={styles.container}>
              <div className={styles.footerInner}>
                <img src="/logo.png" alt="Plumbum" className={styles.footerLogo} />
                <span className={styles.footerText}>{t.result.footerText}</span>
                <Link href="/methodology" className={styles.footerLink}>{t.result.footerMethodology}</Link>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
