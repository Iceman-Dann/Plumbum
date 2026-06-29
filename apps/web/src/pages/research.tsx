import React, { Suspense, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/research.module.css";
import FoiaLetter from "../components/FoiaLetter";

const LeafletMap = React.lazy(() => import("@/components/map/leaflet-map"));

interface CityBudget {
  name: string;
  allocated: number; // Millions
  disbursed: number; // Millions
  pre1986: number; // Percentage
  violations: number;
  unspentGap: number;
  overheadPct: number;
}

const BUDGET_DATA: CityBudget[] = [
  { name: "Chicago, IL", allocated: 148.5, disbursed: 35.6, pre1986: 82, violations: 4, unspentGap: 112.9, overheadPct: 76 },
  { name: "Baltimore, MD", allocated: 88.2, disbursed: 22.0, pre1986: 74, violations: 2, unspentGap: 66.2, overheadPct: 75 },
  { name: "Philadelphia, PA", allocated: 112.0, disbursed: 41.4, pre1986: 68, violations: 3, unspentGap: 70.6, overheadPct: 63 },
  { name: "Milwaukee, WI", allocated: 78.4, disbursed: 28.2, pre1986: 71, violations: 2, unspentGap: 50.2, overheadPct: 64 },
  { name: "Newark, NJ", allocated: 120.0, disbursed: 105.6, pre1986: 78, violations: 1, unspentGap: 14.4, overheadPct: 12 },
  { name: "Flint, MI", allocated: 95.0, disbursed: 82.3, pre1986: 62, violations: 0, unspentGap: 12.7, overheadPct: 14 },
];

export default function Research() {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState<CityBudget>(BUDGET_DATA[0]);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7357, lng: -74.1724 }); // Defaults to Newark area for redlining mapping
  const [mapAddress, setMapAddress] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Press Pitch generator state
  const [reporterName, setReporterName] = useState("");
  const [mediaOutlet, setMediaOutlet] = useState("");
  const [pitchText, setPitchText] = useState("");
  const [copiedPitch, setCopiedPitch] = useState(false);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapAddress.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapAddress)}`);
      const data = await res.json();
      if (data && data[0]) {
        setMapCenter({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGeneratePitch = () => {
    const reporter = reporterName.trim() || "[Reporter Name]";
    const outlet = mediaOutlet.trim() || "[Media Outlet]";
    const text = `Subject: PITCH: Why is ${selectedCity.name} sitting on $${selectedCity.unspentGap}M of unspent EPA lead pipe funds?

Dear ${reporter},

I'm reaching out from the Plumbum civic research coalition regarding a major local story on public health infrastructure in the ${outlet} coverage area.

Federal Safe Drinking Water audits indicate that ${selectedCity.name} has only disbursed $${selectedCity.disbursed}M out of $${selectedCity.allocated}M in Bipartisan Infrastructure Law funds allocated for lead service line replacement. This leaves a staggering $${selectedCity.unspentGap}M discrepancy—about ${selectedCity.overheadPct}% of the budget—stalled in administrative delays while approximately ${selectedCity.pre1986}% of local residences were built during the lead era.

Our research indicates a strong geographic correlation between historic redlining lines (A-D ratings) and current lead pipe exposures. Local water quality records show ${selectedCity.violations} major lead monitoring violations in the last 10 years.

We have launched an interactive geospatial portal at plumbum.io/research that maps these municipal budget gaps and redlining correlations. I would be glad to share the raw datasets, local contact logs, and outline how this funding delay impacts local neighborhoods.

Sincerely,

[Your Name]
Civic Water Advocate, Plumbum Coalition`;
    setPitchText(text);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(pitchText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.portalTag}>DOOR 2: PRO PORTAL</div>
          <h1 className={styles.headline}>For Journalists & Researchers</h1>
          <p className={styles.heroBody}>
            Investigate the intersections of environmental redlining, delayed municipal water budgets, and utility transparency.
          </p>
        </div>
      </header>

      {/* ── Section 1: Redlining Map Overlays ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionMeta}>Geospatial Analysis</span>
            <h2 className={styles.sectionTitle}>1930s Redlining Map Overlays</h2>
            <p className={styles.sectionDesc}>
              Correlate historical HOLC Redlining borders with current predictive lead risk vectors. Type an address or city to geocode and inspect grading overlays.
            </p>
          </div>

          <form onSubmit={handleCitySearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Enter city or address (e.g. Newark, NJ)"
              value={mapAddress}
              onChange={(e) => setMapAddress(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn} disabled={searchLoading}>
              {searchLoading ? "Locating..." : "Inspect Overlays"}
            </button>
          </form>

          <div className={styles.mapContainer}>
            <Suspense fallback={<div className={styles.mapPlaceholder}>Loading interactive map...</div>}>
              <LeafletMap lat={mapCenter.lat} lng={mapCenter.lng} zoom={13} hideOverlays={false} interactive={true} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── Section 2: Budget Discrepancy Dashboard ── */}
      <section className={styles.section} style={{ background: "#FFFFFF", borderTop: "1px solid var(--color-border)" }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionMeta}>Financial Oversight</span>
            <h2 className={styles.sectionTitle}>Municipal Budget Discrepancy Dashboard</h2>
            <p className={styles.sectionDesc}>
              EPA Bipartisan Infrastructure Law funding remains heavily delayed. Select a city below to inspect the discrepancy between federal allocations and actual local disbursements.
            </p>
          </div>

          <div className={styles.dashboardLayout}>
            {/* Left List */}
            <div className={styles.cityList}>
              {BUDGET_DATA.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  className={`${styles.cityBtn} ${selectedCity.name === city.name ? styles.cityBtnActive : ""}`}
                  onClick={() => {
                    setSelectedCity(city);
                    // Clear press pitch when changing city
                    setPitchText("");
                  }}
                >
                  <span className={styles.cityName}>{city.name}</span>
                  <span className={styles.cityLabel}>
                    Gap: ${city.unspentGap}M ({city.overheadPct}% unspent)
                  </span>
                </button>
              ))}
            </div>

            {/* Right Visual Breakdowns */}
            <div className={styles.auditPanel}>
              <div className={styles.auditHeader}>
                <h3>Audit Dossier: {selectedCity.name}</h3>
                <span className={styles.warningPill}>
                  {selectedCity.overheadPct > 50 ? "⚠️ Critical Discrepancy" : "✓ Active Disbursement"}
                </span>
              </div>

              {/* Progress bars */}
              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>
                  <span>Federal Funding Allocated</span>
                  <strong>${selectedCity.allocated}M</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFillAllocated} style={{ width: "100%" }} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>
                  <span>Actual Local Disbursed</span>
                  <strong>${selectedCity.disbursed}M</strong>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFillDisbursed}
                    style={{ width: `${(selectedCity.disbursed / selectedCity.allocated) * 100}%` }}
                  />
                </div>
              </div>

              {/* Funding gap callout */}
              <div className={styles.gapBox} style={{ borderLeftColor: selectedCity.overheadPct > 50 ? "#A63D2F" : "#C07A2A" }}>
                <div className={styles.gapMetrics}>
                  <div>
                    <span className={styles.gapLabel}>Stalled Discrepancy Gap</span>
                    <h4 className={styles.gapValue}>${selectedCity.unspentGap}M</h4>
                  </div>
                  <div>
                    <span className={styles.gapLabel}>Unspent Percentage</span>
                    <h4 className={styles.gapValue}>{selectedCity.overheadPct}%</h4>
                  </div>
                </div>
                <p className={styles.gapNotice}>
                  {selectedCity.overheadPct > 50
                    ? `Warning: ${selectedCity.name} has failed to disburse more than half of its allocated lead pipe remediation funds. This indicate significant administrative gridlock or resource redirection.`
                    : `${selectedCity.name} is making steady progress, having successfully disbursed most of its federal allocation for water lines replacement.`}
                </p>
              </div>

              {/* Context variables */}
              <div className={styles.contextGrid}>
                <div className={styles.contextCell}>
                  <span>Lead-Era Housing (Pre-1986)</span>
                  <strong>{selectedCity.pre1986}%</strong>
                </div>
                <div className={styles.contextCell}>
                  <span>EPA Violations (10-Yr)</span>
                  <strong>{selectedCity.violations}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Press Pitch Generator ── */}
      <section className={styles.section} style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionMeta}>Advocacy Toolkit</span>
            <h2 className={styles.sectionTitle}>Press Pitch Generator</h2>
            <p className={styles.sectionDesc}>
              Mobilize local media. Select a city from the audit list above, customize details, and generate a data-backed email pitch for local environmental or health reporters.
            </p>
          </div>

          <div className={styles.pitchLayout}>
            {/* Input Form */}
            <div className={styles.pitchForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Reporter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>News Outlet / Newspaper Desk</label>
                <input
                  type="text"
                  placeholder="e.g. Newark Star-Ledger"
                  value={mediaOutlet}
                  onChange={(e) => setMediaOutlet(e.target.value)}
                  className={styles.input}
                />
              </div>
              <button
                type="button"
                onClick={handleGeneratePitch}
                className={styles.generateBtn}
              >
                Generate Press Pitch
              </button>
            </div>

            {/* Output Letter */}
            {pitchText && (
              <div className={styles.pitchOutput}>
                <textarea
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  className={styles.pitchTextarea}
                  rows={15}
                  spellCheck={false}
                />
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="button" onClick={handleCopyPitch} className={styles.copyBtn}>
                    {copiedPitch ? "✓ Copied" : "Copy to Clipboard"}
                  </button>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Water quality story idea - BLL and pre-1986 lines in ${selectedCity.name}`)}&body=${encodeURIComponent(pitchText)}`}
                    className={styles.mailtoBtn}
                  >
                    Open in Email Client ✉
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 4: FOIA Stonewall Analyzer ── */}
      <section className={styles.section} style={{ background: "#FFFFFF", borderTop: "1px solid var(--color-border)" }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionMeta}>FOIA Stonewall Analyzer</span>
            <h2 className={styles.sectionTitle}>Utility FOIA Requests</h2>
            <p className={styles.sectionDesc}>
              Force local water districts to disclose digitized records. Generate a state-compliant Public Records Act or FOIA letter requesting detailed lead service line material listings.
            </p>
          </div>
          <div className={styles.foiaWrap}>
            <FoiaLetter address="" censusTract="34013008100" country="us" />
          </div>
        </div>
      </section>
    </div>
  );
}
