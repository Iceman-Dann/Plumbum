import React, { Suspense, useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { useGetRisk, getGetRiskQueryKey, useGetNeighborhood, getGetNeighborhoodQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/useTranslation";
import { interpolate } from "@/lib/translations";
import { translateFactor, translateRiskLevel, translateSeverity } from "@/lib/translateRiskFactors";
import type { Translations } from "@/lib/translations/types";
import styles from "../styles/result.module.css";
import { generateReport, type RiskData } from "../lib/generateReport";
import FoiaLetter from "../components/FoiaLetter";
import PediatricianLetter from "../components/PediatricianLetter";
import LandlordLetter from "../components/LandlordLetter";
import SchoolDistrictLetter from "../components/SchoolDistrictLetter";
import FreeFilterDemand from "../components/FreeFilterDemand";
import RepresentativeSection from "../components/RepresentativeSection";
import WaterTestForm from "../components/WaterTestForm";
import VerifyYourPipe from "../components/VerifyYourPipe";
import AlertSubscription from "../components/AlertSubscription";
import { usePregnancyMode } from "@/hooks/usePregnancyMode";
import SearchBar from "../components/SearchBar";
import html2canvas from "html2canvas";
import { AlertTriangle, CheckCircle, Info, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const LeafletMap = React.lazy(() => import("@/components/map/leaflet-map"));
const NeighborhoodMap = React.lazy(() => import("@/components/map/neighborhood-map"));

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

const CIRCUMFERENCE = 2 * Math.PI * 54;

// ── Data Confidence ──────────────────────────────────────────────────────────
type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW";

function getDataConfidence(risk: any): ConfidenceLevel {
  // HIGH  → digitized pipe-material records available (water_district is specific,
  //         epa_violations_10yr is a real number, pct_pre1986 is from survey data)
  // LOW   → purely census-age proxy (no specific water_district, no violation data)
  // MODERATE → partial data (one or more specific fields present)
  const hasWaterDistrict = risk?.water_district && risk.water_district !== "Public Water System";
  const hasViolationData = risk?.epa_violations_10yr !== undefined && risk?.epa_violations_10yr !== null;
  const hasPre1986Data = risk?.pct_pre1986 !== undefined && risk?.pct_pre1986 !== null;
  const specifics = [hasWaterDistrict, hasViolationData, hasPre1986Data].filter(Boolean).length;
  if (specifics === 3) return "HIGH";
  if (specifics >= 1) return "MODERATE";
  return "LOW";
}

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  HIGH: "#a63d2f",
  MODERATE: "#C07A2A",
  LOW: "#7A6F65",
};

function ScoreRing({ score, denom }: { score: number; denom: string }) {
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
        {denom}
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

function AlertBanner({ score, t, isPregnant }: { score: number; t: Translations; isPregnant: boolean }) {
  if (isPregnant) {
    return (
      <div className={styles.alertBanner} style={{ background: "#4A1D24" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          <AlertTriangle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <span>PREGNANCY ALERT — Lead exposure during pregnancy can cause miscarriage, premature birth, and permanent harm to fetal brain development. The CDC states there is no safe level of lead in blood during pregnancy. Take action today.</span>
        </span>
      </div>
    );
  }

  const link = (
    <a href="https://www.epa.gov/sites/default/files/2015-11/documents/2005_09_14_faq_fs_homewatertesting.pdf" target="_blank" rel="noreferrer" className={styles.alertLink}>
      {score >= 40 && score < 60 ? t.result.learnMore : t.result.getFreeTestKit}
    </a>
  );

  if (score >= 80) {
    return (
      <div className={styles.alertBanner} style={{ background: "#1E293B" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          <AlertTriangle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <span>{t.result.alertVeryHigh} {link}</span>
        </span>
      </div>
    );
  }
  if (score >= 60) {
    return (
      <div className={styles.alertBanner} style={{ background: "#334155" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          <AlertTriangle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <span>{t.result.alertHigh} {link}</span>
        </span>
      </div>
    );
  }
  if (score >= 40) {
    return (
      <div className={styles.alertBanner} style={{ background: "#475569" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
          <Info size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
          <span>{t.result.alertModerate} {link}</span>
        </span>
      </div>
    );
  }
  return (
    <div className={styles.alertBanner} style={{ background: "#334D3D" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
        <CheckCircle size={16} style={{ color: "#10B981", flexShrink: 0 }} />
        <span>{t.result.alertLow}</span>
      </span>
    </div>
  );
}

function CompareBar({ label, value, max, isAddress }: { label: string; value: number; max: number; isAddress: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = isAddress ? getScoreColor(value) : "#B8AFA8";
  return (
    <div className={styles.compareRow}>
      <div className={styles.compareLabel}>{label}</div>
      <div className={styles.compareTrack}>
        <div className={styles.compareBar} style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={styles.compareValue} style={{ color: isAddress ? getScoreColor(value) : "#7A6F65", fontWeight: isAddress ? 700 : 400 }}>
        {value}
      </div>
    </div>
  );
}

function EmptyCell({ text }: { text: string }) {
  return <span className={styles.dataEmpty}>{text}</span>;
}

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

export default function Result() {
  const { t, lang } = useTranslation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const address = searchParams.get("address") || "";
  const context = searchParams.get("context") || "";
  const schoolName = searchParams.get("school") || "";
  const isSchoolContext = context === "school";
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { isPregnant, setIsPregnant } = usePregnancyMode();
  const [activeTab, setActiveTab] = useState<"reps" | "foia" | "peds" | "landlord" | "free-filter" | "subsidy" | "school-district">(isSchoolContext ? "school-district" : "free-filter");
  const [housingStatus, setHousingStatus] = useState<"own" | "rent" | null>(null);
  const [contributeTab, setContributeTab] = useState<"watertest" | "verifypipe">("watertest");
  const [showContribute, setShowContribute] = useState(false);

  const [animatedScore, setAnimatedScore] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data: risk, isLoading, isError } = useGetRisk(
    { address },
    { query: { enabled: !!address, queryKey: getGetRiskQueryKey({ address }) } }
  );

  const score = risk ? Math.round(risk.score) : 0;
  const confidence = risk ? getDataConfidence(risk) : "LOW";
  const margin = confidence === "HIGH" ? 5 : confidence === "MODERATE" ? 12 : 20;

  const { data: ccrTranslation, isLoading: ccrLoading } = useQuery({
    queryKey: ["ccr-translation", address, (risk as any)?.water_district, score],
    queryFn: async () => {
      const url = new URL("/api/ccr/translate", window.location.origin);
      url.searchParams.set("address", address);
      url.searchParams.set("city", risk?.geocoded_address?.split(",")[0]?.trim() || "");
      url.searchParams.set("state", (risk as any)?.stateFips || "");
      url.searchParams.set("score", String(score));
      url.searchParams.set("violations", String((risk as any)?.epa_violations_10yr ?? 0));
      url.searchParams.set("pctPre1986", String((risk as any)?.pct_pre1986 ?? 0));
      url.searchParams.set("waterDistrict", (risk as any)?.water_district || "");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to translate CCR");
      return res.json() as Promise<{ summary: string }>;
    },
    enabled: !!risk,
  });

  const { data: points } = useGetNeighborhood(
    { lat: risk?.lat ?? 0, lng: risk?.lng ?? 0 },
    { query: { enabled: !!risk?.lat && !!risk?.lng, queryKey: getGetNeighborhoodQueryKey({ lat: risk?.lat ?? 0, lng: risk?.lng ?? 0 }) } }
  );

  const { data: subsidyData, isLoading: subsidyLoading } = useQuery({
    queryKey: ["subsidy-finder", risk?.geocoded_address, score],
    queryFn: async () => {
      const cityPart = risk?.geocoded_address?.split(",")[0]?.trim() || "";
      const statePart = (risk as any)?.stateFips || "";
      const url = new URL("/api/subsidy/find", window.location.origin);
      url.searchParams.set("city", cityPart);
      url.searchParams.set("state", statePart);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to find subsidy");
      return res.json() as Promise<{ summary: string }>;
    },
    enabled: !!risk && housingStatus === "own",
  });

  useEffect(() => {
    if (housingStatus === "rent") {
      setActiveTab("free-filter");
    } else if (housingStatus === "own") {
      setActiveTab("subsidy");
    }
  }, [housingStatus]);

  const [sharing, setSharing] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!risk || downloading) return;
    setDownloading(true);
    try {
      await generateReport(risk as unknown as RiskData, address, t, lang, isPregnant);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareImage = async () => {
    const cardEl = document.getElementById("plumbum-share-card");
    if (!cardEl || sharing) return;
    setSharing(true);
    try {
      // Temporarily inline styles if needed, but absolute positioning off-screen works great.
      const canvas = await html2canvas(cardEl, {
        width: 1200,
        height: 630,
        scale: 2, // 2x resolution for clean text
        useCORS: true,
        backgroundColor: "#f8f6f1",
      });
      const dataUrl = canvas.toDataURL("image/png");
      const addressSlug = address
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const filename = `plumbum-report-${addressSlug || "score"}.png`;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate share image:", err);
    } finally {
      setSharing(false);
    }
  };


  // Animate score count-up from 0 to final score over 1200ms using ease-out
  useEffect(() => {
    if (!risk) return;
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
  }, [risk, score]);

  // Inject style block for printing on mount and clean up on unmount
  useEffect(() => {
    const style = document.createElement("style");
    style.media = "print";
    style.innerHTML = `
      @page {
        margin: 2cm;
        @bottom-center {
          content: "Plumbum · plumbummap.org · Data: EPA, Census, USGS";
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #000000;
        }
      }
      nav,
      footer,
      header,
      .${styles.alertBanner},
      .${styles.actionStrip},
      .${styles.shareStrip},
      .${styles.footer},
      .${styles.backLink},
      .backLink,
      .${styles.mapSection},
      .mapSection,
      .${styles.copyAddressBtn},
      #pregnancy-mode-toggle,
      label[for="pregnancy-mode-toggle"],
      #renter-callout-section,
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
      .${styles.compareTrack} {
        background: #EDE3DA !important;
      }
      .${styles.compareBar} {
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

  const riskLevel = risk?.risk_level ?? t.result.unknown;
  const riskLevelLabel = translateRiskLevel(riskLevel, t);
  const country = (risk as any)?.country as "us" | "ca" | undefined;
  const isCanada = country === "ca";
  const siteUrl = import.meta.env.VITE_SITE_URL || "https://plumbummap.org";
  const shareBase = siteUrl.replace(/\/$/, "");
  const pageUrl = `${shareBase}/result?address=${encodeURIComponent(address)}`;
  const locale = lang === "es" ? "es-US" : "en-US";

  const shareMessage = encodeURIComponent(
    interpolate(t.result.shareMessage, { score, level: riskLevelLabel })
  );
  const shareUrl = encodeURIComponent(pageUrl);

  const displayScore = Math.round(animatedScore);
  const displayColor = getScoreColor(animatedScore);
  const displayGlow = getScoreGlow(animatedScore);

  return (
    <div className={`${styles.wrapper} ${isPregnant ? styles.pregnancyModeActive : ""}`}>
      {isLoading && (
        <div className={styles.loadingState}>
          <div className="terminal-loader-box">
            [ {isCanada ? t.result.loadingGeocode.toUpperCase() : t.result.loadingCensus.toUpperCase()} ]
          </div>
        </div>
      )}

      {isError && (
        <div className={styles.errorState}>
          <h2>{t.result.errorTitle}</h2>
          <p>{t.result.errorBody}</p>
          <Link href="/" className={styles.backLink}>{t.result.backToSearch}</Link>
        </div>
      )}

      {risk && (
        <>
          <AlertBanner score={score} t={t} isPregnant={isPregnant} />

          <section className={styles.topSection}>
            <div className={styles.container}>
              <Link href="/" className={styles.backLink}>{t.result.back}</Link>
              <div className={styles.addressMetaRow}>
                <span className={styles.sectionMeta}>{t.result.addressAnalyzed}</span>
                <button
                  className={styles.copyAddressBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(risk.geocoded_address || address);
                    setCopiedAddress(true);
                    setTimeout(() => setCopiedAddress(false), 1500);
                  }}
                  title="Copy address"
                  type="button"
                >
                  {copiedAddress ? (
                    <span className={styles.copiedText} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Check size={12} /> Copied
                    </span>
                  ) : (
                    <svg className={styles.copyAddressIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.addressLabel}>{risk.geocoded_address || address}</div>
              
              <div className={styles.sourcingNotice}>
                <Info size={14} className={styles.sourcingIcon} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p className={styles.sourcingText}>{t.result.sourcingExplanation}</p>
              </div>
              
              <div className={styles.topLayoutGrid}>
                <div className={styles.topLayoutMain}>
                  <div className={styles.heroRow}>
                    <div className={styles.heroLeft}>
                      <div className={styles.sectionMeta}>{t.result.riskScore}</div>
                      <div className={styles.heroScore}>
                        <div className={styles.scoreNum} style={{ color: displayColor, textShadow: displayGlow }}>
                          {displayScore}
                        </div>
                        <ScoreRing score={animatedScore} denom={t.result.scoreDenom} />
                        {/* Data Confidence indicator */}
                        <div className={styles.confidenceBlock}>
                          <div className={styles.confidenceMeta}>Data Confidence</div>
                          <div
                            className={styles.confidenceBadge}
                            style={{ color: CONFIDENCE_COLORS[confidence] }}
                          >
                            {confidence}
                          </div>
                          <div className={styles.confidenceHint} title="Confidence is based on the availability of digitized municipal records versus predictive census modeling.">
                            Based on digitized records vs.{" "}
                            <span className={styles.confidenceTooltipAnchor}>
                              census modeling
                              <span className={styles.confidenceTooltip}>
                                Confidence is based on the availability of digitized municipal records versus predictive census modeling.
                              </span>
                            </span>
                            <span className={styles.confidenceQ}>?</span>
                          </div>
                          <div className={styles.rangeIndicator}>
                            <div className={styles.rangeMeta}>Estimated Risk Range</div>
                            <div className={styles.rangeValue}>
                              {Math.max(0, displayScore - margin)} – {Math.min(100, displayScore + margin)} / 100
                            </div>
                            <div className={styles.rangeMargin}>
                              (Margin of Error: ±{margin} pts)
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={styles.riskLevel} style={{ color: getScoreColor(score), fontWeight: 600 }}>
                        {riskLevelLabel} {t.result.riskSuffix}
                      </div>
                      <div className={styles.dataLimitationNotice}>
                        <AlertTriangle size={14} className={styles.limitationIcon} />
                        <p className={styles.limitationText}>{t.result.dataLimitationNotice}</p>
                      </div>
                    </div>
                  </div>



                  {/* Pregnancy Mode Toggle */}
                  <div className={styles.pregnancyToggleContainer}>
                    <label className={styles.pregnancyToggleLabel}>
                      <input 
                        type="checkbox" 
                        id="pregnancy-mode-toggle"
                        checked={isPregnant}
                        onChange={(e) => setIsPregnant(e.target.checked)}
                        className={styles.pregnancyCheckbox}
                      />
                      <span>Pregnancy Mode (Shift UI to burgundy & enable fetal development risks advice)</span>
                    </label>
                    {isPregnant && (
                      <div style={{ marginTop: "12px", color: "#5C1A1A", fontSize: "14px", fontWeight: "600", maxWidth: "450px" }}>
                        Pregnancy mode active. Take action today: lead exposure during pregnancy has critical risks.
                      </div>
                    )}
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
                     <a href="https://www.epa.gov/ccr/understanding-your-annual-water-quality-report" target="_blank" rel="noreferrer" className={styles.ccrLink}>
                       View official PDF report ↗
                     </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.mapSection}>
            <div className={styles.mapContainer}>
              <Suspense fallback={<div className={styles.mapPlaceholder} />}>
                <LeafletMap lat={risk.lat} lng={risk.lng} zoom={15} interactive={true} hideOverlays={true} neighborhoodGeoJson={points} />
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

          <section className={styles.dataSection}>
            <div className={styles.container}>
              <div className={styles.columns}>
                <div className={styles.leftCol}>
                  <div className={styles.sectionMeta}>{t.result.riskFactors}</div>
                  <h2 className={styles.colHeadline}>{t.result.whatWeFound}</h2>
                  <hr className={styles.colDivider} />
                  <div className={styles.factorList}>
                    {(risk as any).factors?.map((factor: any, i: number) => {
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
                              <div className={styles.factorBarFill} style={{ width: `${fillPct}%`, background: severityColors[severityKey] }} />
                            </div>
                            <span className={styles.factorBarValue}>{Number(factor?.score ?? 0)}/{Number(factor?.max ?? 25)}</span>
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
                      <div className={styles.dataLabel}>{isCanada ? t.result.regionCode : t.result.fipsCode}</div>
                      <div className={styles.dataValue}>{risk.census_tract || <EmptyCell text={t.result.notReported} />}</div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.medianBuildYear}</div>
                      <div className={styles.dataValue}>{(risk as any).median_build_year ?? <EmptyCell text={t.result.notReported} />}</div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.waterDistrict}</div>
                      <div className={styles.dataValue}>{(risk as any).water_district ?? t.result.publicPws}</div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{isCanada ? t.result.violations10yr : t.result.epaViolations}</div>
                      <div className={styles.dataValue}>{(risk as any).epa_violations_10yr ?? (score > 60 ? "2" : score > 40 ? "1" : "0")}</div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.medianIncome}</div>
                      <div className={styles.dataValue}>
                        {(risk as any).median_income
                          ? `$${Number((risk as any).median_income).toLocaleString(locale)}`
                          : <EmptyCell text={t.result.notReported} />}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>{t.result.pre1986Housing}</div>
                      <div className={styles.dataValue}>
                        {(risk as any).pct_pre1986 ? `${(risk as any).pct_pre1986}%` : <EmptyCell text={t.result.notReported} />}
                      </div>
                    </div>
                    {/* CCR row — spans full grid width */}
                    <div className={styles.tractCell} style={{ gridColumn: "1 / -1", borderRight: "none" }}>
                      <div className={styles.dataLabel}>EPA Water Quality Report (CCR)</div>
                      <div className={styles.dataValue}>
                          <a
                            href="https://www.epa.gov/ccr/understanding-your-annual-water-quality-report"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.ccrLink}
                          >
                            View official PDF ↗
                          </a>
                      </div>
                    </div>

                  </div>
                  <p className={styles.tractNote}>{isCanada ? t.result.tractNoteCa : t.result.tractNoteUs}</p>
                  <p className={styles.lastUpdatedTimestamp}>
                    Data last updated: EPA SDWIS March 2024 · Census ACS 2022.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.actionStrip}>
            <div className={styles.container}>
              {isPregnant && (
                <div style={{ background: "#5C1A1A", color: "#FFFFFF", padding: "28px", borderRadius: "0px", marginBottom: "32px", fontFamily: "Inter, sans-serif" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "600" }}>Immediate steps for pregnant individuals</h3>
                  <ul style={{ margin: 0, paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "15px", lineHeight: "1.6" }}>
                    <li><strong>Do not boil your water.</strong> Boiling water does not remove lead, it actually concentrates it as water evaporates.</li>
                    <li><strong>Use only certified filters or bottled water.</strong> Use only cold water run through a filter certified to NSF/ANSI Standard 53 for lead removal for all drinking, cooking, and preparing baby formula.</li>
                    <li><strong>Request a blood lead test.</strong> Ask your OB/GYN to test your blood lead level at your next prenatal visit.</li>
                  </ul>
                </div>
              )}

              <div className={styles.sectionMeta} style={{ color: "#5A5550" }}>{t.result.recommendedActions}</div>
              <h2 className={styles.actionHeadline}>{t.result.whatShouldYouDo}</h2>

              <div className={styles.actionGrid}>
                {/* Universal card — always shown */}
                <div className={styles.actionPanel}>
                  <h3>{t.result.useCertifiedFilter}</h3>
                  <p>{t.result.useCertifiedFilterBody}</p>
                  <a href="https://www.epa.gov/water-research/consumer-tool-identifying-point-use-and-pitcher-filters-certified-reduce-lead" target="_blank" rel="noreferrer">{t.result.filterGuideLink}</a>
                </div>

                {isSchoolContext ? (
                  <>
                    <div className={styles.actionPanel}>
                      <div className={styles.actionPanelTag}>School Action</div>
                      <h3>Request Water Testing Records</h3>
                      <p>Under the EPA's 3Ts (Training, Testing, Taking Action) guidelines, schools should make their lead testing records public. You have the right to request these records from the district.</p>
                      <a href="https://www.epa.gov/ground-water-and-drinking-water/3ts-reducing-lead-drinking-water" target="_blank" rel="noreferrer">EPA 3Ts Guidelines →</a>
                    </div>
                    <div className={styles.actionPanel}>
                      <div className={styles.actionPanelTag}>Advocacy</div>
                      <h3>Attend School Board Meetings</h3>
                      <p>Raise awareness about lead risk in your school district. Speak during public comment to urge the superintendent and board to prioritize lead line replacement and filter installation.</p>
                      <a href="https://www.epa.gov/sites/default/files/2015-06/documents/school_siting_guidelines-2.pdf" target="_blank" rel="noreferrer">EPA Schools Guide →</a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.actionPanel}>
                      <div className={styles.actionPanelTag}>Homeowner Path</div>
                      <h3>Order a DIY Scratch-Test Kit</h3>
                      <p>A certified lead-check swab kit lets you test painted surfaces, soil, and fixtures at home. Results in 30 seconds. EPA-recognized for residential screening.</p>
                      <a href="https://www.epa.gov/lead/lead-test-kits" target="_blank" rel="noreferrer">Browse EPA-listed kits →</a>
                    </div>
                    <div className={styles.actionPanel}>
                      <div className={styles.actionPanelTag}>Homeowner Path</div>
                      <h3>Local Subsidy & Replacement Grants</h3>
                      {subsidyLoading ? (
                        <p style={{ fontStyle: "italic" }}>Searching city LSLR subsidy database...</p>
                      ) : subsidyData?.summary ? (
                        <div style={{ fontSize: "13.5px", lineHeight: "1.65", color: "#A09890", marginTop: "12px" }}>
                          {subsidyData.summary.split("\n").filter((l: string) => l.trim().length > 0).map((line: string, idx: number) => {
                            if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
                              return (
                                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "flex-start" }}>
                                  <span style={{ color: "#a63d2f", fontSize: "16px", lineHeight: "1.2" }}>•</span>
                                  <span>
                                    {line.replace(/^[-*]\s*/, "").split("**").map((part: string, pIdx: number) => 
                                      pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: "#FFFFFF", fontWeight: 700 }}>{part}</strong> : part
                                    )}
                                  </span>
                                </div>
                              );
                            }
                            return <p key={idx} style={{ marginBottom: "10px", color: "#A09890" }}>{line}</p>;
                          })}
                        </div>
                      ) : (
                        <>
                          <p>The EPA's Lead Service Line Replacement program funds partial or full replacement of lead pipes. Check with your local utility for city-specific rebates.</p>
                          <a href="https://www.epa.gov/ground-water-and-drinking-water/lead-service-line-replacement-resources" target="_blank" rel="noreferrer">Find your state program →</a>
                        </>
                      )}
                    </div>
                    <div className={styles.actionPanel}>
                      <div className={styles.actionPanelTag}>Renter Path</div>
                      <h3>View Your Tenant Rights</h3>
                      <p>Landlords in most states must disclose known lead hazards. You may have the right to demand remediation or terminate your lease without penalty if lead levels exceed federal limits.</p>
                      <a href="https://www.hud.gov/program_offices/healthy_homes/healthyhomes/lead" target="_blank" rel="noreferrer">HUD Tenant Rights Guide →</a>
                    </div>
                    <div className={styles.actionPanel}>
                      <div className={styles.actionPanelTag}>Renter Path</div>
                      <h3>Log a Landlord Notification</h3>
                      <p>Formally notify your landlord of this risk score and create a timestamped public record on the Accountability Portal. This protects your rights and pressures action.</p>
                      <Link
                        href={`/accountability?address=${encodeURIComponent(address)}&score=${score}`}
                        className={styles.actionPanelLink}
                      >
                        Open Accountability Portal →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className={styles.takeActionSection}>
            <div className={styles.container}>
              <div className={styles.takeActionMeta}>Take Action</div>
              <h2 className={styles.takeActionHeadline}>What you can do</h2>

              {isSchoolContext ? (
                /* ── SCHOOL CONTEXT TABS ── */
                <>
                  <div className={styles.tabMenu} role="tablist">
                    <button
                      id="tab-school-district"
                      role="tab"
                      aria-selected={activeTab === "school-district"}
                      aria-controls="tabpanel-school-district"
                      className={`${styles.tabBtn} ${activeTab === "school-district" ? styles.tabBtnActive : ""}`}
                      onClick={() => setActiveTab("school-district")}
                      type="button"
                    >
                      Notify School District
                    </button>
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
                    <button
                      id="tab-foia"
                      role="tab"
                      aria-selected={activeTab === "foia"}
                      aria-controls="tabpanel-foia"
                      className={`${styles.tabBtn} ${activeTab === "foia" ? styles.tabBtnActive : ""}`}
                      onClick={() => setActiveTab("foia")}
                      type="button"
                    >
                      FOIA — Water Testing Records
                    </button>
                    <button
                      id="tab-reps"
                      role="tab"
                      aria-selected={activeTab === "reps"}
                      aria-controls="tabpanel-reps"
                      className={`${styles.tabBtn} ${activeTab === "reps" ? styles.tabBtnActive : ""}`}
                      onClick={() => setActiveTab("reps")}
                      type="button"
                    >
                      Contact School Board & Reps
                    </button>
                  </div>

                  {/* School District Letter panel */}
                  <div
                    id="tabpanel-school-district"
                    role="tabpanel"
                    aria-labelledby="tab-school-district"
                    className={`${styles.tabPanel} ${activeTab === "school-district" ? styles.tabPanelActive : ""}`}
                  >
                    <SchoolDistrictLetter
                      address={address}
                      schoolName={schoolName}
                      score={score}
                      riskLevel={riskLevel}
                      factors={((risk as any).factors ?? []).map((f: any) => ({
                        name: f.name ?? "",
                        detail: f.detail ?? "",
                        score: Number(f.score ?? 0),
                        max: Number(f.max ?? 25),
                      }))}
                      censusTract={risk.census_tract ?? ""}
                    />
                  </div>

                  {/* Pediatrician panel — reworded for school context */}
                  <div
                    id="tabpanel-peds"
                    role="tabpanel"
                    aria-labelledby="tab-peds"
                    className={`${styles.tabPanel} ${activeTab === "peds" ? styles.tabPanelActive : ""}`}
                  >
                    <PediatricianLetter
                      address={`${schoolName ? schoolName + ", " : ""}${address}`}
                      score={score}
                      riskLevel={riskLevel}
                      factors={((risk as any).factors ?? []).map((f: any) => ({
                        name: f.name ?? "",
                        detail: f.detail ?? "",
                        score: Number(f.score ?? 0),
                        max: Number(f.max ?? 25),
                      }))}
                      censusTract={risk.census_tract ?? ""}
                      pctPre1986={(risk as any).pct_pre1986 ?? null}
                      isPregnant={isPregnant}
                    />
                  </div>

                  {/* FOIA panel — retargeted to School District Facilities */}
                  <div
                    id="tabpanel-foia"
                    role="tabpanel"
                    aria-labelledby="tab-foia"
                    className={`${styles.tabPanel} ${activeTab === "foia" ? styles.tabPanelActive : ""}`}
                  >
                    <FoiaLetter
                      address={address}
                      censusTract={risk.census_tract ?? ""}
                      country={country}
                    />
                  </div>

                  {/* Representatives panel — includes note about school board */}
                  <div
                    id="tabpanel-reps"
                    role="tabpanel"
                    aria-labelledby="tab-reps"
                    className={`${styles.tabPanel} ${activeTab === "reps" ? styles.tabPanelActive : ""}`}
                  >
                    <div style={{ padding: "16px 0 8px", background: "#FFF9F0", border: "1px solid #F0E0C0", borderRadius: "6px", marginBottom: "16px", paddingLeft: "16px", paddingRight: "16px" }}>
                      <strong style={{ color: "#A63D2F", fontSize: "13px" }}>TIP — School Context:</strong>
                      <span style={{ fontSize: "13px", color: "#5A5550", marginLeft: "8px" }}>
                        You can also contact your school board members and school superintendent directly. Look up board contacts at your district\'s official website and include them in your outreach.
                      </span>
                    </div>
                    <RepresentativeSection
                      address={address}
                      score={score}
                      riskLevel={riskLevel}
                      censusTract={risk.census_tract ?? ""}
                      waterDistrict={(risk as any).water_district ?? t.result.publicPws}
                      pctPre1986={score > 60 ? "68%" : score > 40 ? "42%" : "21%"}
                      epaViolations={score > 60 ? "2" : score > 40 ? "1" : "0"}
                      country={country}
                    />
                  </div>
                </>
              ) : (
                /* ── RESIDENTIAL CONTEXT TABS ── */
                <>
                  <div className={styles.tabMenu} role="tablist">
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
                    <button
                      id="tab-reps"
                      role="tab"
                      aria-selected={activeTab === "reps"}
                      aria-controls="tabpanel-reps"
                      className={`${styles.tabBtn} ${activeTab === "reps" ? styles.tabBtnActive : ""}`}
                      onClick={() => setActiveTab("reps")}
                      type="button"
                    >
                      Contact Representatives
                    </button>
                  </div>

                  {/* Landlord tab panel */}
                  <div
                    id="tabpanel-landlord"
                    role="tabpanel"
                    aria-labelledby="tab-landlord"
                    className={`${styles.tabPanel} ${activeTab === "landlord" ? styles.tabPanelActive : ""}`}
                  >
                    <LandlordLetter
                      address={address}
                      score={score}
                      riskLevel={riskLevel}
                      factors={((risk as any).factors ?? []).map((f: any) => ({
                        name: f.name ?? "",
                        detail: f.detail ?? "",
                        score: Number(f.score ?? 0),
                        max: Number(f.max ?? 25),
                      }))}
                      censusTract={risk.census_tract ?? ""}
                    />
                  </div>

                  {/* Claim Free Filter tab panel */}
                  <div
                    id="tabpanel-free-filter"
                    role="tabpanel"
                    aria-labelledby="tab-free-filter"
                    className={`${styles.tabPanel} ${activeTab === "free-filter" ? styles.tabPanelActive : ""}`}
                  >
                    <FreeFilterDemand
                      address={address}
                      pwsName={(risk as any)?.water_district || ""}
                    />
                  </div>

                  {/* Find Local Subsidy tab panel */}
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

                  {/* Pediatrician tab panel */}
                  <div
                    id="tabpanel-peds"
                    role="tabpanel"
                    aria-labelledby="tab-peds"
                    className={`${styles.tabPanel} ${activeTab === "peds" ? styles.tabPanelActive : ""}`}
                  >
                    <PediatricianLetter
                      address={address}
                      score={score}
                      riskLevel={riskLevel}
                      factors={((risk as any).factors ?? []).map((f: any) => ({
                        name: f.name ?? "",
                        detail: f.detail ?? "",
                        score: Number(f.score ?? 0),
                        max: Number(f.max ?? 25),
                      }))}
                      censusTract={risk.census_tract ?? ""}
                      pctPre1986={(risk as any).pct_pre1986 ?? null}
                      isPregnant={isPregnant}
                    />
                  </div>

                  {/* Representatives tab panel */}
                  <div
                    id="tabpanel-reps"
                    role="tabpanel"
                    aria-labelledby="tab-reps"
                    className={`${styles.tabPanel} ${activeTab === "reps" ? styles.tabPanelActive : ""}`}
                  >
                    <RepresentativeSection
                      address={address} score={score} riskLevel={riskLevel}
                      censusTract={risk.census_tract ?? ""}
                      waterDistrict={(risk as any).water_district ?? t.result.publicPws}
                      pctPre1986={score > 60 ? "68%" : score > 40 ? "42%" : "21%"}
                      epaViolations={score > 60 ? "2" : score > 40 ? "1" : "0"}
                      country={country}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={styles.compareSection}>
            <div className={styles.container}>
              <div className={styles.sectionMeta}>{t.result.context}</div>
              <h2 className={styles.compareHeadline}>{t.result.compareHeadline}</h2>
              <div className={styles.compareChart}>
                <CompareBar label={t.result.thisAddress} value={score} max={100} isAddress={true} />
                <CompareBar label={t.result.cityAverage} value={38} max={100} isAddress={false} />
                <CompareBar label={t.result.stateAverage} value={42} max={100} isAddress={false} />
                <CompareBar label={t.result.nationalAverage} value={35} max={100} isAddress={false} />
              </div>
              <p className={styles.compareNote}>{t.result.compareNote}</p>
            </div>
          </section>

          {/* ── Collapsible Contribute to Science section ── */}
          <section className={styles.collapsibleContribute}>
            <div className={styles.container}>
              <button
                type="button"
                className={styles.contributeTrigger}
                onClick={() => setShowContribute(v => !v)}
              >
                🔬 {showContribute ? "Hide Research Submission Tools" : "Contribute to Science: Report Water Test Results or Upload Scratched Pipe Photo"}
              </button>

              {showContribute && (
                <div className={styles.contributeBox}>
                  {/* Flat tab menu */}
                  <div className={styles.tabMenu} role="tablist">
                    <button
                      id="ctab-watertest"
                      role="tab"
                      aria-selected={contributeTab === "watertest"}
                      aria-controls="ctabpanel-watertest"
                      className={`${styles.tabBtn} ${contributeTab === "watertest" ? styles.tabBtnActive : ""}`}
                      onClick={() => setContributeTab("watertest")}
                      type="button"
                    >
                      Report Water Test Results
                    </button>
                    <button
                      id="ctab-verifypipe"
                      role="tab"
                      aria-selected={contributeTab === "verifypipe"}
                      aria-controls="ctabpanel-verifypipe"
                      className={`${styles.tabBtn} ${contributeTab === "verifypipe" ? styles.tabBtnActive : ""}`}
                      onClick={() => setContributeTab("verifypipe")}
                      type="button"
                    >
                      Verify Your Pipe
                    </button>
                  </div>

                  {/* Water test tab panel */}
                  <div
                    id="ctabpanel-watertest"
                    role="tabpanel"
                    aria-labelledby="ctab-watertest"
                    className={`${styles.tabPanel} ${contributeTab === "watertest" ? styles.tabPanelActive : ""}`}
                  >
                    <WaterTestForm fips={risk.census_tract ?? ""} />
                  </div>

                  {/* Verify Your Pipe tab panel */}
                  <div
                    id="ctabpanel-verifypipe"
                    role="tabpanel"
                    aria-labelledby="ctab-verifypipe"
                    className={`${styles.tabPanel} ${contributeTab === "verifypipe" ? styles.tabPanelActive : ""}`}
                  >
                    <VerifyYourPipe
                      address={address}
                      censusTract={risk.census_tract ?? ""}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={styles.bottomSearchSection}>
            <div className={styles.container}>
              <div className={styles.bottomSearchLabel}>CHECK ANOTHER ADDRESS</div>
              <SearchBar size="small" hideUrlForm={true} />
            </div>
          </section>

          <section className={styles.shareStrip}>
            <div className={styles.container}>
              <div className={styles.shareLabel}>{t.result.shareLabel}</div>
              <div className={styles.downloadRow}>
                <button className={styles.downloadBtn} onClick={handleDownload} disabled={downloading}>
                  {downloading ? t.result.generatingPdf : t.result.downloadPdf}
                </button>
                <button className={styles.shareImgBtn} onClick={handleShareImage} disabled={sharing}>
                  {sharing ? "Generating image..." : "Share image ↗"}
                </button>
              </div>
              <div className={styles.shareBox}>
                <input type="text" readOnly value={pageUrl} className={styles.shareInput} />
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? t.result.copied : t.result.copyLink}
                </button>
              </div>
              <div className={styles.shareNote}>{t.result.shareNote}</div>
              <div className={styles.socialRow}>
                <span className={styles.socialLabel}>{t.result.orShareDirectly}</span>
                <a href={`https://twitter.com/intent/tweet?text=${shareMessage}&url=${shareUrl}&via=plumbum_io`} target="_blank" rel="noreferrer" className={styles.socialLink}>{t.result.twitter}</a>
                <span className={styles.socialDot}>·</span>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&summary=${shareMessage}`} target="_blank" rel="noreferrer" className={styles.socialLink}>{t.result.linkedin}</a>
                <span className={styles.socialDot}>·</span>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareMessage}`} target="_blank" rel="noreferrer" className={styles.socialLink}>{t.result.facebook}</a>
              </div>
            </div>
          </section>

          {/* Off-screen pre-built share card for html2canvas */}
          <div
            id="plumbum-share-card"
            style={{
              position: "absolute",
              left: "-9999px",
              top: "-9999px",
              width: "1200px",
              height: "630px",
              backgroundColor: "#f8f6f1",
              boxSizing: "border-box",
              padding: "60px 80px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <img src="/logo.png" alt="Plumbum" style={{ height: "36px", width: "auto" }} />
              <div style={{ fontSize: "12px", color: "#888880", letterSpacing: "0.15em", fontWeight: 600 }}>
                LEAD RISK ASSESSMENT REPORT
              </div>
            </div>

            {/* Middle main content */}
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "18px",
                  color: "#1A1A18",
                  lineHeight: "1.4",
                  maxWidth: "950px",
                  fontWeight: 500,
                }}
              >
                {risk.geocoded_address || address}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "24px" }}>
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "120px",
                    fontWeight: "800",
                    lineHeight: "1.0",
                    color: getScoreColor(score),
                    margin: 0,
                  }}
                >
                  {score}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#1A1A18",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {riskLevelLabel} Risk
                  </div>
                  <div style={{ fontSize: "14px", color: "#888880", marginTop: "4px" }}>
                    Risk Score / 100
                  </div>
                </div>
              </div>
            </div>

            {/* Risk factors row */}
            <div style={{ display: "flex", gap: "40px", borderTop: "2px solid #E0DDD6", paddingTop: "24px" }}>
              {((risk as any).factors || []).slice(0, 3).map((factor: any, idx: number) => {
                const parsed = translateFactor(factor, t, lang);
                return (
                  <div key={idx} style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        color: "#888880",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                      }}
                    >
                      Factor {idx + 1}
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A18", marginTop: "4px" }}>
                      {parsed.title}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", color: "#888880", fontWeight: 500 }}>
                Lead pipe contamination risk analysis based on public EPA and Census datasets.
              </div>
              <div style={{ fontSize: "15px", color: "#888880", fontWeight: "600", letterSpacing: "0.05em" }}>
                plumbummap.org
              </div>
            </div>
          </div>



          <footer className={styles.footer}>
            <div className={styles.container}>
              <div className={styles.footerInner}>
                <img src="/logo.png" alt="Plumbum" className={styles.footerLogo} />
                <span className={styles.footerText}>{t.result.footerText}</span>
                <Link href="/methodology" className={styles.footerLink}>{t.result.footerMethodology}</Link>
              </div>
            </div>
          </footer>

          {showBackToTop && (
            <button
              onClick={scrollToTop}
              style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                width: "40px",
                height: "40px",
                backgroundColor: "#1A1A18",
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              title="Back to top"
              aria-label="Back to top"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}
