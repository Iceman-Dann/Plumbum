/**
 * EPA SDWIS (Safe Drinking Water Information System) violation loader.
 *
 * Loads the EPA violations JSON file from /data/epa_violations.json into
 * memory on first access. Counts PB90 (lead action level exceedances) and
 * CU90 (copper action level exceedances) violations per state within the
 * past 10 years.
 *
 * The JSON file should be downloaded by running:
 *   node data/download_datasets.mjs
 *
 * Data source: EPA EFSERVICE SDWIS VIOLATION endpoint.
 */

import fs from "fs";
import path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EpaViolation {
  PWSID?: string;
  /** State FIPS or state abbreviation */
  PRIMACY_AGENCY_CODE?: string;
  CONTAMINANT_CODE?: string;
  COMPLIANCE_PERIOD_BEGIN_DATE?: string;
  VIOLATION_BEGIN_DATE?: string;
  IS_HEALTH_BASED_IND?: string;
  /** State 2-letter abbreviation sometimes included */
  STATE_CODE?: string;
}

// ── In-memory store ────────────────────────────────────────────────────────────

/** violations grouped by state FIPS code (2-digit) or state abbreviation */
let violationsByState: Map<string, EpaViolation[]> | null = null;
let totalLoaded = 0;
let loadError: string | null = null;
let loadAttempted = false;

const DATA_PATH = path.resolve(process.cwd(), "data", "epa_violations.json");

// Relevant contaminant codes
const LEAD_COPPER_CODES = new Set(["PB90", "CU90", "PB", "CU", "5000", "2040", "2041", "1030"]);

// 10 years ago
const TEN_YEARS_AGO = new Date();
TEN_YEARS_AGO.setFullYear(TEN_YEARS_AGO.getFullYear() - 10);

// ── State abbreviation → FIPS map ──────────────────────────────────────────────

const STATE_ABBR_TO_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06",
  CO: "08", CT: "09", DE: "10", DC: "11", FL: "12",
  GA: "13", HI: "15", ID: "16", IL: "17", IN: "18",
  IA: "19", KS: "20", KY: "21", LA: "22", ME: "23",
  MD: "24", MA: "25", MI: "26", MN: "27", MS: "28",
  MO: "29", MT: "30", NE: "31", NV: "32", NH: "33",
  NJ: "34", NM: "35", NY: "36", NC: "37", ND: "38",
  OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49",
  VT: "50", VA: "51", WA: "53", WV: "54", WI: "55",
  WY: "56", PR: "72",
};

// ── Loader ─────────────────────────────────────────────────────────────────────

function normalizeToFips(code: string): string {
  if (!code) return "";
  const upper = code.trim().toUpperCase();
  // Already a 2-digit FIPS?
  if (/^\d{2}$/.test(upper)) return upper;
  // State abbreviation?
  if (STATE_ABBR_TO_FIPS[upper]) return STATE_ABBR_TO_FIPS[upper];
  // PWSID starts with state abbr (e.g. "MI1234567")
  const prefix = upper.slice(0, 2);
  if (STATE_ABBR_TO_FIPS[prefix]) return STATE_ABBR_TO_FIPS[prefix];
  return upper;
}

function loadViolations(): void {
  if (loadAttempted) return;
  loadAttempted = true;

  if (!fs.existsSync(DATA_PATH)) {
    loadError = `EPA violations file not found at ${DATA_PATH}. Run: node data/download_datasets.mjs`;
    console.warn(`[epaLoader] ${loadError}`);
    return;
  }

  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const all: EpaViolation[] = JSON.parse(raw);

    violationsByState = new Map<string, EpaViolation[]>();
    let kept = 0;

    for (const v of all) {
      const code = v.CONTAMINANT_CODE?.trim().toUpperCase() ?? "";
      if (!LEAD_COPPER_CODES.has(code)) continue;

      // Parse violation date
      const dateStr = v.COMPLIANCE_PERIOD_BEGIN_DATE || v.VIOLATION_BEGIN_DATE;
      if (dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d.getTime()) || d < TEN_YEARS_AGO) continue;
      }

      // Determine state key — prefer PRIMACY_AGENCY_CODE, fallback to PWSID prefix
      const rawState =
        v.PRIMACY_AGENCY_CODE ||
        v.STATE_CODE ||
        (v.PWSID ? v.PWSID.slice(0, 2) : "");
      const fips = normalizeToFips(rawState);
      if (!fips) continue;

      if (!violationsByState.has(fips)) violationsByState.set(fips, []);
      violationsByState.get(fips)!.push(v);
      kept++;
    }

    totalLoaded = kept;
    console.info(`[epaLoader] Loaded ${kept} relevant violations (lead/copper, last 10 years) across ${violationsByState.size} states.`);
  } catch (err) {
    loadError = `Failed to parse EPA violations file: ${err}`;
    console.error(`[epaLoader] ${loadError}`);
  }
}

// Kick off load immediately when module is imported
loadViolations();

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get the number of lead/copper action level violations in the past 10 years
 * for a given state (by FIPS code).
 *
 * Returns 0 if the file was not loaded or the state has no violations on record.
 * Absence of violations does NOT mean absence of risk — Factor 2 has a minimum of
 * 5 points when data is unavailable (handled in scoreEngine.ts).
 */
export function getViolationCountForState(stateFips: string): number {
  if (!violationsByState) return -1; // signals "data unavailable"
  const fips = stateFips.padStart(2, "0");
  return violationsByState.get(fips)?.length ?? 0;
}

/** Get all violations for a specific state */
export function getViolationsForState(stateFips: string): EpaViolation[] {
  if (!violationsByState) return [];
  const fips = stateFips.padStart(2, "0");
  return violationsByState.get(fips) ?? [];
}

/** Whether the EPA data file was loaded successfully */
export function isEpaDataLoaded(): boolean {
  return violationsByState !== null && violationsByState.size > 0;
}

/** Cache and load statistics for /api/cache-stats */
export function getEpaCacheStats() {
  return {
    loaded: isEpaDataLoaded(),
    total_violations_tracked: totalLoaded,
    states_with_violations: violationsByState?.size ?? 0,
    load_error: loadError,
    data_path: DATA_PATH,
  };
}
