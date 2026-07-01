import { useState, useEffect, useRef } from "react";
import styles from "./VideoExplainerAnimation.module.css";
import { useTranslation } from "@/hooks/useTranslation";

const ADDRESS = "124 Maple St, Flint, MI";
const PHASES = ["type", "scan", "reveal", "pause"] as const;
type Phase = typeof PHASES[number];

const TIMING = {
  type: 2200,   // typewriter
  scan: 2000,   // scanning bars
  reveal: 2500, // score reveal
  pause: 1500,  // hold before reset
};

export default function VideoExplainerAnimation() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("type");
  const [typedChars, setTypedChars] = useState(0);
  const [score, setScore] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── Phase sequencer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (phase === "type") {
      // Typewriter char-by-char
      setTypedChars(0);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setTypedChars(i);
        if (i >= ADDRESS.length) {
          clearInterval(interval);
          timerRef.current = setTimeout(() => setPhase("scan"), 400);
        }
      }, TIMING.type / ADDRESS.length);
      return () => clearInterval(interval);
    }

    if (phase === "scan") {
      setScanPct(0);
      const start = Date.now();
      const tick = () => {
        const pct = Math.min((Date.now() - start) / TIMING.scan, 1);
        setScanPct(pct);
        if (pct < 1) rafRef.current = requestAnimationFrame(tick);
        else timerRef.current = setTimeout(() => setPhase("reveal"), 200);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }

    if (phase === "reveal") {
      setScore(0);
      const start = Date.now();
      const tick = () => {
        const pct = Math.min((Date.now() - start) / TIMING.reveal, 1);
        const eased = 1 - Math.pow(1 - pct, 3); // ease-out cubic
        setScore(Math.round(eased * 84));
        if (pct < 1) rafRef.current = requestAnimationFrame(tick);
        else timerRef.current = setTimeout(() => setPhase("pause"), 300);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }

    if (phase === "pause") {
      timerRef.current = setTimeout(() => setPhase("type"), TIMING.pause);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  const gaugeAngle = (score / 100) * 180 - 90; // -90 (left) to +90 (right)

  return (
    <div className={styles.container} aria-label="Interactive demo: how Plumbum works">
      {/* Phase indicator pills */}
      <div className={styles.phasePills}>
        {(["type", "scan", "reveal"] as Phase[]).map((p, i) => (
          <div key={p} className={`${styles.pill} ${phase === p || (phase === "pause" && p === "reveal") ? styles.pillActive : ""}`}>
            <span className={styles.pillNumber}>{i + 1}</span>
            <span className={styles.pillLabel}>
              {p === "type" ? t.videoDemo.enterAddress : p === "scan" ? t.videoDemo.analyzingData : t.videoDemo.riskScore}
            </span>
          </div>
        ))}
      </div>

      {/* ── Phase 1: Type ─────────────────────────────────────────────────── */}
      <div className={`${styles.panel} ${phase === "type" ? styles.panelVisible : styles.panelHidden}`}>
        <div className={styles.mockInput}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <span className={styles.typedText}>
            {ADDRESS.slice(0, typedChars)}
            <span className={styles.cursor}>|</span>
          </span>
        </div>
        <div className={styles.mockSubtext}>{t.videoDemo.inputSubtitle}</div>
      </div>

      {/* ── Phase 2: Scan ─────────────────────────────────────────────────── */}
      <div className={`${styles.panel} ${phase === "scan" ? styles.panelVisible : styles.panelHidden}`}>
        <div className={styles.scanLabel}>
          <span className={styles.scanDot} />
          {t.videoDemo.analyzingRecords}
        </div>
        <div className={styles.scanBars}>
          {[t.videoDemo.housingAge, t.videoDemo.epaViolationsCount, t.videoDemo.incomeIndex, t.videoDemo.leadLslMap, t.videoDemo.acsDemographics].map((label, i) => (
            <div key={label} className={styles.scanRow}>
              <span className={styles.scanRowLabel}>{label}</span>
              <div className={styles.scanBarBg}>
                <div
                  className={styles.scanBarFill}
                  style={{
                    width: `${Math.max(0, Math.min(100, (scanPct - i * 0.15) * (1 / 0.4) * 100))}%`,
                    transitionDelay: `${i * 60}ms`,
                  }}
                />
              </div>
              <span className={styles.scanCheck} style={{ opacity: scanPct > i * 0.15 + 0.35 ? 1 : 0 }}>✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Phase 3: Reveal ───────────────────────────────────────────────── */}
      <div className={`${styles.panel} ${(phase === "reveal" || phase === "pause") ? styles.panelVisible : styles.panelHidden}`}>
        {/* Gauge */}
        <div className={styles.gaugeWrap}>
          <svg className={styles.gaugeSvg} viewBox="0 0 200 120" fill="none">
            {/* Track */}
            <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="#1e2533" strokeWidth="14" strokeLinecap="round" />
            {/* Fill arc — drawn via stroke-dasharray trick */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              stroke={score >= 65 ? "#c0392b" : score >= 35 ? "#e67e22" : "#27ae60"}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 251.2} 251.2`}
              style={{ transition: "stroke-dasharray 0.05s linear, stroke 0.3s" }}
            />
            {/* Needle */}
            <line
              x1="100" y1="100"
              x2={100 + 60 * Math.cos((gaugeAngle - 90) * Math.PI / 180)}
              y2={100 + 60 * Math.sin((gaugeAngle - 90) * Math.PI / 180)}
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ transition: "x2 0.05s linear, y2 0.05s linear" }}
            />
            <circle cx="100" cy="100" r="6" fill="white" />
            {/* Zone labels */}
            <text x="15" y="116" fill="#4a7c59" fontSize="9" fontWeight="600">{t.riskLevels.low.toUpperCase()}</text>
            <text x="87" y="10" fill="#c07a2a" fontSize="9" fontWeight="600">{t.riskLevels.moderate.toUpperCase()}</text>
            <text x="156" y="116" fill="#a63d2f" fontSize="9" fontWeight="600">{t.riskLevels.high.toUpperCase()}</text>
          </svg>
          <div className={styles.gaugeScore} style={{ color: score >= 65 ? "#e74c3c" : score >= 35 ? "#e67e22" : "#2ecc71" }}>
            {score}
          </div>
          <div className={styles.gaugeLabel}>/ 100</div>
        </div>

        {/* Risk badge */}
        <div className={`${styles.riskBadge} ${score >= 65 ? styles.riskHigh : score >= 35 ? styles.riskMed : styles.riskLow}`}>
          {score >= 65 ? t.videoDemo.highRiskAlert : score >= 35 ? t.videoDemo.moderateRiskAlert : t.videoDemo.lowRiskAlert}
        </div>

        {/* Factors */}
        <div className={styles.factorList}>
          {[
            { label: t.videoDemo.pre1986, weight: 34 },
            { label: t.videoDemo.violations10yr, weight: 28 },
            { label: t.videoDemo.leadLslLikely, weight: 22 },
          ].map(f => (
            <div key={f.label} className={styles.factorRow}>
              <span className={styles.factorLabel}>{f.label}</span>
              <span className={styles.factorWeight}>+{f.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.footerDot} />
        {t.videoDemo.footerText}
      </div>
    </div>
  );
}
