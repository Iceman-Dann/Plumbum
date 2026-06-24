import React, { Suspense, useState } from "react";
import { useSearch, Link } from "wouter";
import { useGetRisk, getGetRiskQueryKey } from "@workspace/api-client-react";
import styles from "../styles/result.module.css";
import { generateReport, type RiskData } from "../lib/generateReport";
import FoiaLetter from "../components/FoiaLetter";
import RepresentativeSection from "../components/RepresentativeSection";
import WaterTestForm from "../components/WaterTestForm";

const LeafletMap = React.lazy(() => import("@/components/map/leaflet-map"));

const CIRCUMFERENCE = 2 * Math.PI * 54;

function ScoreRing({ score }: { score: number }) {
  const targetOffset = CIRCUMFERENCE * (1 - score / 100);
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      className={styles.ring}
    >
      <circle cx="60" cy="60" r="54" fill="none" stroke="#E8E0D8" strokeWidth="8" />
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke="#A63D2F"
        strokeWidth="8"
        strokeDasharray={CIRCUMFERENCE}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        className={styles.ringProgress}
        style={{ "--target-offset": `${targetOffset}px` } as React.CSSProperties}
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fill="#7A6F65"
        fontFamily="Inter, sans-serif"
      >/ 100</text>
    </svg>
  );
}

type Severity = "HIGH" | "MODERATE" | "LOW";

interface ParsedFactor {
  title: string;
  explanation: string;
  severity: Severity;
}

function parseFactor(raw: string): ParsedFactor {
  const lower = raw.toLowerCase();
  let severity: Severity = "MODERATE";
  let title = raw;
  let explanation = "This condition elevates estimated lead exposure risk for this address.";

  if (lower.includes("pre-1986") || lower.includes("pre 1986") || lower.includes("built before")) {
    title = "Pre-1986 Construction";
    explanation = "Homes built before 1986 are significantly more likely to have lead solder or lead service lines, as the Safe Drinking Water Act lead ban wasn't enacted until that year.";
    severity = "HIGH";
  } else if (lower.includes("epa violation") || lower.includes("violation on record")) {
    title = "EPA Violation on Record";
    explanation = "A documented EPA Safe Drinking Water Act violation has been recorded in this water system within the past 10 years.";
    severity = "HIGH";
  } else if (lower.includes("superfund") || lower.includes("cercla")) {
    title = "Proximity to Superfund Site";
    explanation = "This address is within proximity of an EPA Superfund site, which may indicate historical contamination of soil or groundwater.";
    severity = "HIGH";
  } else if (lower.includes("corrosive") || lower.includes("ph level") || lower.includes("ph ")) {
    title = "Corrosive Water Chemistry";
    explanation = "Corrosive water accelerates leaching of lead from pipes and solder joints into drinking water, even at low concentrations in the source water.";
    severity = "MODERATE";
  } else if (lower.includes("galvanized") || lower.includes("steel pipe")) {
    title = "Galvanized Steel Pipes";
    explanation = "Galvanized pipes can harbor lead deposits from decades of contact with lead service lines, releasing particles when disturbed.";
    severity = "MODERATE";
  } else if (lower.includes("older infra") || lower.includes("aging infra") || lower.includes("infrastructure")) {
    title = "Aging Water Infrastructure";
    explanation = "This water system has infrastructure rated as aging or in poor condition, increasing the risk of pipe degradation and lead release.";
    severity = "MODERATE";
  } else if (lower.includes("income") || lower.includes("low-income") || lower.includes("economic")) {
    title = "Low-Income Census Tract";
    explanation = "Lower-income areas are statistically more likely to have older housing stock and less investment in water infrastructure replacement.";
    severity = "LOW";
  } else if (lower.includes("density") || lower.includes("high population")) {
    title = "High-Density Urban Area";
    explanation = "Dense urban areas often contain older buried infrastructure, with a higher proportion of original lead service lines still in use.";
    severity = "LOW";
  } else {
    const words = raw.split(/[\s-]+/).slice(0, 4).join(" ");
    title = words.charAt(0).toUpperCase() + words.slice(1);
    explanation = raw;
    severity = "MODERATE";
  }

  return { title, explanation, severity };
}

const severityColors: Record<Severity, string> = {
  HIGH: "#A63D2F",
  MODERATE: "#C07A2A",
  LOW: "#4A7C59",
};

function AlertBanner({ score }: { score: number }) {
  if (score >= 60) {
    return (
      <div className={styles.alertBanner} style={{ background: "#A63D2F" }}>
        <span>⚠ This address shows a <strong>HIGH RISK</strong> score. We strongly recommend getting your water tested.{" "}
          <a href="https://www.epa.gov/ground-water-and-drinking-water/get-your-water-tested" target="_blank" rel="noreferrer" className={styles.alertLink}>Get a free test kit →</a>
        </span>
      </div>
    );
  }
  if (score >= 40) {
    return (
      <div className={styles.alertBanner} style={{ background: "#C07A2A" }}>
        <span>⚠ This address shows a <strong>MODERATE RISK</strong> score. Consider having your water tested as a precaution.{" "}
          <a href="https://www.epa.gov/ground-water-and-drinking-water/get-your-water-tested" target="_blank" rel="noreferrer" className={styles.alertLink}>Learn more →</a>
        </span>
      </div>
    );
  }
  return (
    <div className={styles.alertBanner} style={{ background: "#4A7C59" }}>
      <span>✓ This address shows a <strong>LOW RISK</strong> score. Continue monitoring and use a certified filter for extra peace of mind.</span>
    </div>
  );
}

function CompareBar({ label, value, max, isAddress }: { label: string; value: number; max: number; isAddress: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={styles.compareRow}>
      <div className={styles.compareLabel}>{label}</div>
      <div className={styles.compareTrack}>
        <div
          className={styles.compareBar}
          style={{ width: `${pct}%`, background: isAddress ? "#A63D2F" : "#B8AFA8" }}
        />
      </div>
      <div
        className={styles.compareValue}
        style={{
          color: isAddress ? "#A63D2F" : "#7A6F65",
          fontWeight: isAddress ? 700 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyCell() {
  return <span className={styles.dataEmpty}>Not reported</span>;
}

export default function Result() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const address = searchParams.get("address") || "";
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: risk, isLoading, isError } = useGetRisk(
    { address },
    {
      query: {
        enabled: !!address,
        queryKey: getGetRiskQueryKey({ address }),
      }
    }
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!risk || downloading) return;
    setDownloading(true);
    try {
      await generateReport(risk as RiskData, address);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const score = risk ? Math.round(risk.score) : 0;
  const riskLevel = risk?.risk_level ?? "Unknown";
  const pageUrl = window.location.href;

  const shareMessage = encodeURIComponent(
    `I checked my home's lead pipe risk using Plumbum, a free open-source public health tool. My address scored ${score}/100 — ${riskLevel} Risk. Check yours:`
  );
  const shareUrl = encodeURIComponent(pageUrl);

  return (
    <div className={styles.wrapper}>
      {isLoading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner}></div>
            <p>Matching your address to census records...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className={styles.errorState}>
          <h2>Unable to Find Address</h2>
          <p>We could not geocode this address or find it in our records.</p>
          <Link href="/" className={styles.backLink}>← Back to search</Link>
        </div>
      )}

      {risk && (
        <>
          <AlertBanner score={score} />

          <section className={styles.topSection}>
            <div className={styles.container}>
              <Link href="/" className={styles.backLink}>← Back</Link>

              <div className={styles.sectionMeta}>ADDRESS ANALYZED</div>
              <div className={styles.addressLabel}>{risk.geocoded_address || address}</div>

              <div className={styles.heroRow}>
                <div className={styles.heroLeft}>
                  <div className={styles.sectionMeta}>RISK SCORE</div>
                  <div className={styles.heroScore}>
                    <div className={styles.scoreNum}>{score}</div>
                    <ScoreRing score={score} />
                  </div>
                  <div className={styles.riskLevel}>{riskLevel} Risk</div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.mapSection}>
            <div className={styles.mapContainer}>
              <Suspense fallback={<div className={styles.mapPlaceholder} />}>
                <LeafletMap lat={risk.lat} lng={risk.lng} zoom={15} interactive={true} />
              </Suspense>
            </div>
          </section>

          <section className={styles.dataSection}>
            <div className={styles.container}>
              <div className={styles.columns}>
                <div className={styles.leftCol}>
                  <div className={styles.sectionMeta}>RISK FACTORS</div>
                  <h2 className={styles.colHeadline}>What we found</h2>
                  <hr className={styles.colDivider} />
                  <div className={styles.factorList}>
                    {risk.factors.map((factor, i) => {
                      const parsed = parseFactor(factor);
                      return (
                        <div key={i} className={styles.factorPanel}>
                          <div className={styles.factorHeader}>
                            <h3 className={styles.factorTitle}>{parsed.title}</h3>
                            <span
                              className={styles.severityPill}
                              style={{
                                background: severityColors[parsed.severity] + "1A",
                                color: severityColors[parsed.severity],
                                borderColor: severityColors[parsed.severity] + "40",
                              }}
                            >
                              {parsed.severity}
                            </span>
                          </div>
                          <p className={styles.factorExplanation}>{parsed.explanation}</p>
                          <p className={styles.factorRaw}>{factor}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <div className={styles.sectionMeta}>LOCATION DOSSIER</div>
                  <h2 className={styles.colHeadline}>Census tract</h2>
                  <hr className={styles.colDivider} />
                  <div className={styles.tractGrid}>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>FIPS CODE</div>
                      <div className={styles.dataValue}>{risk.census_tract || <EmptyCell />}</div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>MEDIAN BUILD YEAR</div>
                      <div className={styles.dataValue}>
                        {(risk as any).median_build_year ?? "est. 1971"}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>WATER DISTRICT</div>
                      <div className={styles.dataValue}>
                        {(risk as any).water_district ?? "Public PWS"}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>EPA VIOLATIONS (10YR)</div>
                      <div className={styles.dataValue}>
                        {(risk as any).epa_violations_10yr ?? (score > 60 ? "2" : score > 40 ? "1" : "0")}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>MEDIAN INCOME</div>
                      <div className={styles.dataValue}>
                        {(risk as any).median_income
                          ? `$${Number((risk as any).median_income).toLocaleString()}`
                          : <EmptyCell />}
                      </div>
                    </div>
                    <div className={styles.tractCell}>
                      <div className={styles.dataLabel}>% PRE-1986 HOUSING</div>
                      <div className={styles.dataValue}>
                        {(risk as any).pct_pre1986
                          ? `${(risk as any).pct_pre1986}%`
                          : (score > 60 ? "68%" : score > 40 ? "42%" : "21%")}
                      </div>
                    </div>
                  </div>
                  <p className={styles.tractNote}>
                    Analysis evaluated at the census block group level to maintain statistical validity while protecting individual privacy.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.actionStrip}>
            <div className={styles.container}>
              <div className={styles.sectionMeta} style={{ color: "#5A5550" }}>RECOMMENDED ACTIONS</div>
              <h2 className={styles.actionHeadline}>What should you do?</h2>
              <div className={styles.actionGrid}>
                <div className={styles.actionPanel}>
                  <h3>Get a water test</h3>
                  <p>Order a certified lead test kit through your state's drinking water program. Results in 5–10 business days.</p>
                  <a href="https://www.epa.gov/ground-water-and-drinking-water/get-your-water-tested" target="_blank" rel="noreferrer">Find a certified lab ↗</a>
                </div>
                <div className={styles.actionPanel}>
                  <h3>Contact your utility</h3>
                  <p>Request your utility's lead service line inventory and ask about replacement timelines under the EPA Lead and Copper Rule.</p>
                  <a href="https://www.epa.gov/ground-water-and-drinking-water/find-contacts-drinking-water-services" target="_blank" rel="noreferrer">Utility lookup ↗</a>
                </div>
                <div className={styles.actionPanel}>
                  <h3>Use a certified filter</h3>
                  <p>NSF/ANSI 53 certified filters remove lead at point of use while you wait for pipe replacement. Pitcher and faucet options available.</p>
                  <a href="https://www.nsf.org/consumer-resources/articles/certified-filters-lead" target="_blank" rel="noreferrer">Filter guide ↗</a>
                </div>
              </div>
            </div>
          </section>

          <FoiaLetter
            address={address}
            censusTract={risk.census_tract ?? ""}
          />

          <RepresentativeSection
            address={address}
            score={score}
            riskLevel={riskLevel}
            censusTract={risk.census_tract ?? ""}
            waterDistrict={(risk as any).water_district ?? "Public PWS"}
            pctPre1986={score > 60 ? "68%" : score > 40 ? "42%" : "21%"}
            epaViolations={score > 60 ? "2" : score > 40 ? "1" : "0"}
          />

          <section className={styles.compareSection}>
            <div className={styles.container}>
              <div className={styles.sectionMeta}>CONTEXT</div>
              <h2 className={styles.compareHeadline}>How does your neighborhood compare?</h2>
              <div className={styles.compareChart}>
                <CompareBar label="This address" value={score} max={100} isAddress={true} />
                <CompareBar label="City average" value={38} max={100} isAddress={false} />
                <CompareBar label="State average" value={42} max={100} isAddress={false} />
                <CompareBar label="National average" value={35} max={100} isAddress={false} />
              </div>
              <p className={styles.compareNote}>Averages are weighted by census tract population. City and state values reflect data from the EPA ECHO database.</p>
            </div>
          </section>

          <WaterTestForm fips={risk.census_tract ?? ""} />

          <section className={styles.shareStrip}>
            <div className={styles.container}>
              <div className={styles.shareLabel}>SHARE THIS RESULT</div>
              <div className={styles.downloadRow}>
                <button
                  className={styles.downloadBtn}
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? "Generating PDF…" : "Download PDF Report ↗"}
                </button>
              </div>
              <div className={styles.shareBox}>
                <input type="text" readOnly value={pageUrl} className={styles.shareInput} />
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
              <div className={styles.shareNote}>Results are generated live — no personal data is stored or associated with this link.</div>
              <div className={styles.socialRow}>
                <span className={styles.socialLabel}>Or share directly:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareMessage}&url=${shareUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.socialLink}
                >Twitter/X</a>
                <span className={styles.socialDot}>·</span>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&summary=${shareMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.socialLink}
                >LinkedIn</a>
                <span className={styles.socialDot}>·</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.socialLink}
                >Facebook</a>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <div className={styles.container}>
              <div className={styles.footerInner}>
                <img src="/logo.png" alt="Plumbum" className={styles.footerLogo} />
                <span className={styles.footerText}>
                  Lead pipe risk assessment · Data from EPA ECHO, Census Bureau, and USGS · Not affiliated with any government agency
                </span>
                <Link href="/methodology" className={styles.footerLink}>Methodology</Link>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
