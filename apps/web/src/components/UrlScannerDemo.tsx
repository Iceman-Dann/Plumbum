import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "./UrlScannerDemo.module.css";

const DEMO_URL = "https://www.zillow.com/homedetails/124-Maple-St-Flint-MI-48503/90512774_zpid/";

type DemoPhase = "idle" | "typing" | "scanning" | "result";
const LOOP_INTERVAL = 7000; // ms before restarting

export default function UrlScannerDemo() {
  const { t, lang } = useTranslation();
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [typedChars, setTypedChars] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const DEMO_FACTORS = [
    { label: t.videoDemo.pre1986, value: "+34 pts", severity: "high" },
    { label: t.videoDemo.violations10yr, value: "+28 pts", severity: "high" },
    { label: t.videoDemo.leadLslLikely, value: "+22 pts", severity: "med" },
  ];

  const reset = () => {
    setPhase("idle");
    setTypedChars(0);
    setScanPct(0);
  };

  const startDemo = () => {
    if (phase !== "idle") return;
    setPhase("typing");
  };

  useEffect(() => {
    if (phase === "idle") {
      // Auto-start after brief delay
      timerRef.current = setTimeout(() => setPhase("typing"), 800);
      return;
    }

    if (phase === "typing") {
      setTypedChars(0);
      let i = 0;
      const total = DEMO_URL.length;
      const interval = setInterval(() => {
        i++;
        setTypedChars(i);
        if (i >= total) {
          clearInterval(interval);
          timerRef.current = setTimeout(() => setPhase("scanning"), 300);
        }
      }, 1800 / total);
      return () => clearInterval(interval);
    }

    if (phase === "scanning") {
      setScanPct(0);
      const start = Date.now();
      const duration = 2200;
      const tick = () => {
        const pct = Math.min((Date.now() - start) / duration, 1);
        setScanPct(pct);
        if (pct < 1) rafRef.current = requestAnimationFrame(tick);
        else timerRef.current = setTimeout(() => setPhase("result"), 200);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }

    if (phase === "result") {
      timerRef.current = setTimeout(reset, LOOP_INTERVAL);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  return (
    <div
      className={`${styles.container} ${phase === "idle" ? styles.clickable : ""}`}
      onClick={startDemo}
      role={phase === "idle" ? "button" : undefined}
      aria-label="Click to see URL scanner demo"
    >
      {/* ── Mock Browser Bar ──────────────────────────────────────────────── */}
      <div className={styles.browserBar}>
        <div className={styles.browserDots}>
          <span className={styles.dot} style={{ background: "#ff5f57" }} />
          <span className={styles.dot} style={{ background: "#febc2e" }} />
          <span className={styles.dot} style={{ background: "#28c840" }} />
        </div>
        <div className={styles.urlBar}>
          {phase === "idle" ? (
            <span className={styles.urlPlaceholder}>
              {lang === "es" ? "Pegue una URL de Zillow o Redfin para ver una demostración…" : "Paste a Zillow or Redfin URL to see a demo…"}
            </span>
          ) : (
            <span className={styles.urlText}>
              {DEMO_URL.slice(0, typedChars)}
              {phase === "typing" && <span className={styles.cursor}>|</span>}
            </span>
          )}
        </div>
      </div>

      {/* ── Scanning Progress ─────────────────────────────────────────────── */}
      {(phase === "scanning" || phase === "result") && (
        <div className={styles.scanSection}>
          <div className={styles.scanStatus}>
            {phase === "scanning" ? (
              <>
                <span className={styles.scanSpinner} />
                {lang === "es" ? "Analizando datos de la propiedad…" : "Analyzing listing data…"}{" "}
                <span className={styles.scanPct}>{Math.round(scanPct * 100)}%</span>
              </>
            ) : (
              <>
                <span className={styles.scanDone}>✓</span>
                {lang === "es" ? "Análisis completo" : "Analysis complete"}
              </>
            )}
          </div>
          <div className={styles.progressBg}>
            <div
              className={`${styles.progressFill} ${phase === "result" ? styles.progressComplete : ""}`}
              style={{ width: phase === "result" ? "100%" : `${scanPct * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Result Dossier ────────────────────────────────────────────────── */}
      <div className={`${styles.dossier} ${phase === "result" ? styles.dossierVisible : ""}`}>
        <div className={styles.dossierHeader}>
          <div className={styles.dossierTitle}>
            <span className={styles.dossierDot} />
            {lang === "es" ? "Expediente de Riesgo" : "Risk Dossier"}
          </div>
          <div className={styles.dossierBadge}>{t.videoDemo.highRiskAlert}</div>
        </div>

        <div className={styles.dossierScore}>
          <div className={styles.dossierScoreNum}>84</div>
          <div className={styles.dossierScoreBar}>
            <div className={styles.dossierScoreFill} />
          </div>
          <div className={styles.dossierScoreLabel}>/ 100</div>
        </div>

        <div className={styles.dossierFactors}>
          {DEMO_FACTORS.map((f, i) => (
            <div key={f.label} className={styles.dossierFactor} style={{ animationDelay: `${i * 100}ms` }}>
              <span className={styles.dossierFactorLabel}>{f.label}</span>
              <span className={`${styles.dossierFactorValue} ${f.severity === "high" ? styles.fvHigh : styles.fvMed}`}>
                {f.value}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.dossierAddress}>124 Maple St, Flint, MI 48503</div>
      </div>

      {phase === "idle" && (
        <div className={styles.idleHint}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {lang === "es" ? "Haga clic para ver demostración" : "Click to watch demo"}
        </div>
      )}
    </div>
  );
}
