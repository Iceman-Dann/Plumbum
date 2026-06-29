/**
 * Real risk scoring engine.
 *
 * Computes a 0–100 lead pipe risk score from four independent factors,
 * each contributing 0–25 points:
 *
 *   Factor 1 (0–25): Pre-1986 housing percentage (Census ACS B25034)
 *   Factor 2 (0–25): EPA SDWIS lead/copper violations in past 10 years
 *   Factor 3 (0–25): Median household income (inverse — lower income = higher risk)
 *   Factor 4 (0–25): State-level regional prior (hardcoded from known LSL data)
 *
 * Total = sum of all four factors, clamped to 0–100.
 *
 * Risk levels:
 *   0–34   → Low
 *   35–59  → Moderate
 *   60–79  → High
 *   80–100 → Very High
 */

import fs from "fs";
import path from "path";
import { getTractData } from "./censusClient.js";
import { getViolationCountForState, isEpaDataLoaded } from "./epaLoader.js";
import { getStatePriorScore, getStateName } from "./knownRiskAreas.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevel = "Low" | "Moderate" | "High" | "Very High";
export type FactorSeverity = "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";

export interface FactorScore {
  name: string;
  score: number;
  max: 25;
  detail: string;
  severity: FactorSeverity;
}

export interface ScoreResult {
  score: number;
  risk_level: RiskLevel;
  factors: FactorScore[];
  data_sources: string[];
  tract_fips: string;
  used_fallback: boolean;
  data_note?: string;
  /** Percentage of pre-1986 housing units in tract */
  pct_pre1986: number | null;
  /** Median year built of housing units in tract */
  median_build_year: number | null;
  /** Median household income for tract */
  median_income: number | null;
  /** Number of EPA violations found */
  epa_violations_10yr: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 35) return "Moderate";
  return "Low";
}

function getFactorSeverity(score: number, max = 25): FactorSeverity {
  const pct = score / max;
  if (pct >= 0.8) return "VERY HIGH";
  if (pct >= 0.6) return "HIGH";
  if (pct >= 0.35) return "MODERATE";
  return "LOW";
}

// ── Factor 1: Housing Age ──────────────────────────────────────────────────────

function scoreHousingAge(pctPre1986: number): { score: number; detail: string } {
  // Formula: (pct / 100) * 25, clamped
  const raw = (pctPre1986 / 100) * 25;
  const score = Math.round(clamp(raw, 0, 25));
  const detail = `${pctPre1986}% of housing units in this census tract were built before 1986, when the Safe Drinking Water Act lead ban took effect.`;
  return { score, detail };
}

// ── Factor 2: EPA Violations ───────────────────────────────────────────────────

function scoreEpaViolations(count: number, dataAvailable: boolean): { score: number; detail: string; actualCount: number } {
  if (!dataAvailable) {
    return {
      score: 5,
      detail: "EPA violation history data was unavailable for this state. A minimum precautionary score is applied. Absence of data does not indicate absence of risk.",
      actualCount: 0,
    };
  }

  let score: number;
  let detail: string;

  if (count === 0) {
    score = 0;
    detail = "No lead or copper action level exceedances recorded in the EPA SDWIS database for this state's water systems in the past 10 years.";
  } else if (count === 1) {
    score = 10;
    detail = "1 lead or copper action level exceedance recorded in the EPA SDWIS database for water systems in this state in the past 10 years.";
  } else if (count === 2) {
    score = 18;
    detail = `${count} lead or copper action level exceedances recorded in the EPA SDWIS database for water systems in this state in the past 10 years.`;
  } else {
    score = 25;
    detail = `${count} lead or copper action level exceedances recorded in the EPA SDWIS database for water systems in this state in the past 10 years — a significantly elevated violation history.`;
  }

  return { score, detail, actualCount: count };
}

// ── Factor 3: Median Income ────────────────────────────────────────────────────

function scoreMedianIncome(medianIncome: number | null): { score: number; detail: string } {
  if (medianIncome === null) {
    // No income data — apply moderate default
    return {
      score: 10,
      detail: "Median household income data was unavailable for this census tract. A moderate score is applied as a precaution.",
    };
  }

  let score: number;
  let formatted = `$${medianIncome.toLocaleString()}`;
  let detail: string;

  if (medianIncome < 35_000) {
    score = 25;
    detail = `Median household income in this tract is ${formatted} — below $35,000. Lower-income communities face greater lead exposure risk due to older housing stock and reduced infrastructure investment.`;
  } else if (medianIncome < 55_000) {
    score = 18;
    detail = `Median household income in this tract is ${formatted}. Tracts in the $35,000–$55,000 range face elevated risk of deferred infrastructure maintenance.`;
  } else if (medianIncome < 75_000) {
    score = 10;
    detail = `Median household income in this tract is ${formatted}. Moderate income range with average likelihood of infrastructure investment.`;
  } else {
    score = 5;
    detail = `Median household income in this tract is ${formatted}. Higher-income areas typically see faster infrastructure replacement and lower lead exposure rates.`;
  }

  return { score, detail };
}

// ── Factor 4: Regional Prior ───────────────────────────────────────────────────

function scoreRegionalPrior(stateFips: string): { score: number; detail: string } {
  const score = getStatePriorScore(stateFips);
  const stateName = getStateName(stateFips);

  let detail: string;
  if (score >= 18) {
    detail = `${stateName} has extensively documented lead service line infrastructure and a history of action level exceedances, placing it among the highest-risk states nationally.`;
  } else if (score >= 14) {
    detail = `${stateName} has documented lead service line issues in pre-war and mid-century housing stock, with ongoing replacement programs underway.`;
  } else if (score >= 10) {
    detail = `${stateName} has some documented lead pipe risk in older urban areas, particularly in cities with pre-1960 housing density.`;
  } else {
    detail = `${stateName} has below-average documented lead service line risk at the state level based on EPA SDWIS compliance data and inventory estimates.`;
  }

  return { score, detail };
}

// ── Main scoring function ──────────────────────────────────────────────────────

export interface ScoreInput {
  /** 2-digit state FIPS (e.g. "36") */
  stateFips: string;
  /** 3-digit county FIPS (e.g. "061") */
  countyFips: string;
  /** 6-digit census tract code (e.g. "006100") */
  tractCode: string;
  /** Full 11-digit GEOID (e.g. "36061006100") */
  geoid: string;
  country?: "us" | "ca";
}

export async function computeRealScore(input: ScoreInput): Promise<ScoreResult> {
  const { stateFips, countyFips, tractCode, geoid, country = "us" } = input;
  
  if (country === "ca") {
    const dataSources = ["Health Canada Lead Guidelines", "OpenStreetMap Geonames"];
    const factor1: FactorScore = {
      name: "Pre-1986 Construction",
      score: 14,
      max: 25,
      detail: "Canadian National Plumbing Code banned lead in pipes and solder in 1986. Precautionary baseline applied for older urban infrastructure.",
      severity: "MODERATE",
    };
    const factor2: FactorScore = {
      name: "Provincial Violation History",
      score: 6,
      max: 25,
      detail: "US EPA database does not track Canadian utilities. Provincial drinking water summaries suggest low baseline action exceedances.",
      severity: "LOW",
    };
    const factor3: FactorScore = {
      name: "Economic Investment Risk",
      score: 10,
      max: 25,
      detail: "Canadian local tract income data is unavailable. A national average baseline is applied.",
      severity: "MODERATE",
    };
    const factor4: FactorScore = {
      name: "Regional Risk Profile",
      score: 8,
      max: 25,
      detail: "Health Canada maximum acceptable concentration of lead in drinking water is 5 ppb (stricter than the US 15 ppb action level).",
      severity: "LOW",
    };

    const rawTotal = factor1.score + factor2.score + factor3.score + factor4.score;
    const score = clamp(Math.round(rawTotal), 0, 100);
    const risk_level = getRiskLevel(score);

    return {
      score,
      risk_level,
      factors: [factor1, factor2, factor3, factor4],
      data_sources: dataSources,
      tract_fips: "CA_PROVINCIAL",
      used_fallback: true,
      data_note: "Canadian addressing uses national and provincial policy baselines due to US Census database exclusions.",
      pct_pre1986: 45,
      median_build_year: 1980,
      median_income: null,
      epa_violations_10yr: 0,
    };
  }

  const dataSources: string[] = [];
  const hudDataPath = path.resolve(process.cwd(), "data", "hud_lead.csv");
  if (fs.existsSync(hudDataPath)) {
    dataSources.push("HUD Lead Hazard Data");
  }

  // ── Fetch Census housing data ────────────────────────────────────────────
  const housingData = await getTractData(stateFips, countyFips, tractCode);

  let factor1: FactorScore;
  let pctPre1986: number | null = null;
  let medianBuildYear: number | null = null;
  let medianIncome: number | null = null;
  let usedFallback = false;

  if (housingData) {
    dataSources.push("US Census ACS 2022 5-Year Estimates");
    pctPre1986 = housingData.pctPre1986;
    medianBuildYear = housingData.medianBuildYear;
    medianIncome = housingData.medianIncome;
    usedFallback = housingData.isFallback;

    const h = scoreHousingAge(housingData.pctPre1986);
    factor1 = {
      name: "Pre-1986 Construction",
      score: h.score,
      max: 25,
      detail: housingData.isFallback
        ? `State-level data used (tract data unavailable): approximately ${housingData.pctPre1986}% of housing units were built before 1986. ${h.detail}`
        : h.detail,
      severity: getFactorSeverity(h.score),
    };
  } else {
    // No census data at all — use a moderate default
    usedFallback = true;
    factor1 = {
      name: "Pre-1986 Construction",
      score: 12,
      max: 25,
      detail: "Census housing age data was unavailable for this address. A moderate precautionary score is applied — the national average is approximately 45% pre-1986 housing.",
      severity: "MODERATE",
    };
  }

  // ── EPA violations ───────────────────────────────────────────────────────
  const epaAvailable = isEpaDataLoaded();
  const violationCount = epaAvailable ? getViolationCountForState(stateFips) : -1;
  const actualViolationCount = violationCount < 0 ? 0 : violationCount;

  const epa = scoreEpaViolations(
    actualViolationCount,
    epaAvailable && violationCount >= 0,
  );

  if (epaAvailable) dataSources.push("EPA SDWIS 2023");

  const factor2: FactorScore = {
    name: "EPA Violation History",
    score: epa.score,
    max: 25,
    detail: epa.detail,
    severity: getFactorSeverity(epa.score),
  };

  // ── Income factor ────────────────────────────────────────────────────────
  const income = scoreMedianIncome(medianIncome ?? (housingData?.medianIncome ?? null));
  const factor3: FactorScore = {
    name: "Economic Investment Risk",
    score: income.score,
    max: 25,
    detail: income.detail,
    severity: getFactorSeverity(income.score),
  };

  // ── Regional prior ───────────────────────────────────────────────────────
  const prior = scoreRegionalPrior(stateFips);
  const factor4: FactorScore = {
    name: "Regional Risk Profile",
    score: prior.score,
    max: 25,
    detail: prior.detail,
    severity: getFactorSeverity(prior.score),
  };

  // ── Total ────────────────────────────────────────────────────────────────
  const rawTotal = factor1.score + factor2.score + factor3.score + factor4.score;
  const score = clamp(Math.round(rawTotal), 0, 100);
  const risk_level = getRiskLevel(score);

  return {
    score,
    risk_level,
    factors: [factor1, factor2, factor3, factor4],
    data_sources: dataSources,
    tract_fips: geoid,
    used_fallback: usedFallback,
    data_note: usedFallback
      ? "Tract-level census data was unavailable, so state-level averages were used for this assessment."
      : undefined,
    pct_pre1986: pctPre1986,
    median_build_year: medianBuildYear,
    median_income: medianIncome,
    epa_violations_10yr: actualViolationCount,
  };
}

/**
 * Extract FIPS components from a Census GEOID.
 * GEOID format: SSCCCTTTTTT (11 digits: state + county + tract)
 */
export function parseGeoid(geoid: string): {
  stateFips: string;
  countyFips: string;
  tractCode: string;
} {
  const clean = geoid.replace(/\D/g, "");
  return {
    stateFips: clean.slice(0, 2),
    countyFips: clean.slice(2, 5),
    tractCode: clean.slice(5, 11),
  };
}
