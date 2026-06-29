import React from "react";
import type { RiskResult } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/useTranslation";
import { translateRiskLevel, translateFactorDetail } from "@/lib/translateRiskFactors";
import styles from "../styles/resultcard.module.css";
import { Link } from "wouter";

const LeafletMap = React.lazy(() => import("@/components/map/leaflet-map"));

interface ResultCardProps {
  result: RiskResult;
  showFullDetails?: boolean;
}

export default function ResultCard({ result, showFullDetails = false }: ResultCardProps) {
  const { t, lang } = useTranslation();

  const getBadgeClass = (level: string) => {
    const l = level.toUpperCase();
    if (l === "HIGH" || l === "VERY HIGH") return styles.badge;
    if (l === "MODERATE") return `${styles.badge} ${styles.badgeModerate}`;
    return `${styles.badge} ${styles.badgeLow}`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "#A63D2F"; // High
    if (score >= 35) return "#C08020"; // Moderate
    return "#2D6A4F"; // Low
  };

  const riskLabel = translateRiskLevel(result.risk_level, t);

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.address}>{result.address}</div>
        <div className={getBadgeClass(result.risk_level)}>{riskLabel.toUpperCase()} {t.resultCard.riskSuffix}</div>
      </div>

      <div className={styles.meterSection}>
        <div className={styles.meterHeader}>
          <div className={styles.meterValue}>
            <span className={styles.meterScore}>{Math.round(result.score)}</span>
            <span className={styles.meterDenom}>/100</span>
          </div>
          <div className={styles.meterLevel} style={{ color: getRiskColor(result.score) }}>
            {riskLabel} {t.result.riskSuffix}
          </div>
        </div>

        <div className={styles.meterTrack}>
          <div 
            className={styles.meterFill} 
            style={{ 
              width: `${result.score}%`,
              backgroundColor: getRiskColor(result.score)
            }}
          />
          <div 
            className={styles.meterPin} 
            style={{ left: `${result.score}%` }} 
          />
        </div>

        <div className={styles.meterLabels}>
          <span className={styles.meterLabel}>Low</span>
          <span className={styles.meterLabel}>Moderate</span>
          <span className={styles.meterLabel}>High</span>
          <span className={styles.meterLabel}>Very High</span>
        </div>
      </div>

      <div className={styles.mapWrapper}>
        <React.Suspense fallback={<div className="w-full h-full bg-surface" />}>
          <LeafletMap lat={result.lat} lng={result.lng} zoom={15} interactive={false} />
        </React.Suspense>
      </div>

      <div className={styles.factors}>
        {result.factors.slice(0, showFullDetails ? undefined : 2).map((factor, i) => (
          <div key={i} className={styles.factor}>
            {translateFactorDetail(factor.detail, lang)}
          </div>
        ))}
      </div>

      {!showFullDetails && (
        <div className="mb-6">
          <Link href={`/result?address=${encodeURIComponent(result.address)}`} className="text-sm underline">
            {t.resultCard.viewFullReport}
          </Link>
        </div>
      )}

      <div className={styles.disclaimer}>
        {t.resultCard.disclaimer}
      </div>
    </div>
  );
}
