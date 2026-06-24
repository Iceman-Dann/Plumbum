import React from "react";
import type { RiskResult } from "@workspace/api-client-react/src/generated/api.schemas";
import styles from "../styles/resultcard.module.css";
import { Link } from "wouter";

const LeafletMap = React.lazy(() => import("@/components/map/leaflet-map"));

interface ResultCardProps {
  result: RiskResult;
  showFullDetails?: boolean;
}

export default function ResultCard({ result, showFullDetails = false }: ResultCardProps) {
  const getBadgeClass = (level: string) => {
    if (level === "HIGH") return styles.badge;
    if (level === "MODERATE") return `${styles.badge} ${styles.badgeModerate}`;
    return `${styles.badge} ${styles.badgeLow}`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.address}>{result.address}</div>
        <div className={getBadgeClass(result.riskLevel)}>{result.riskLevel} RISK</div>
      </div>

      <div className={styles.scoreRow}>
        <div className={styles.score}>{Math.round(result.score)}</div>
        <div className={styles.scoreDenom}>/100</div>
      </div>
      
      <div className={styles.riskLevel}>
        {result.riskLevel === "HIGH" ? "High Risk" : result.riskLevel === "MODERATE" ? "Moderate Risk" : "Low Risk"}
      </div>

      <div className={styles.mapWrapper}>
        <React.Suspense fallback={<div className="w-full h-full bg-surface" />}>
          <LeafletMap lat={result.lat} lng={result.lng} zoom={15} interactive={false} />
        </React.Suspense>
      </div>

      <div className={styles.factors}>
        {result.factors.slice(0, showFullDetails ? undefined : 2).map((factor, i) => (
          <div key={i} className={styles.factor}>{factor}</div>
        ))}
      </div>

      {!showFullDetails && (
        <div className="mb-6">
          <Link href={`/result?address=${encodeURIComponent(result.address)}`} className="text-sm underline">
            View full report
          </Link>
        </div>
      )}

      <div className={styles.disclaimer}>
        This is an estimate based on census data and public records. It is not a guarantee of lead presence.
      </div>
    </div>
  );
}
