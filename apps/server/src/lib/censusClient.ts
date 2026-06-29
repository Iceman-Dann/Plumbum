/**
 * Census ACS (American Community Survey) client.
 *
 * Fetches housing unit counts by decade built (B25034) and median household
 * income (B19013) for census tracts and states.
 *
 * Data source: US Census Bureau ACS 5-Year Estimates 2022
 * API docs: https://api.census.gov/data/2022/acs/acs5/variables.html
 *
 * Census variables used:
 *   B25034_001E  Total housing units
 *   B25034_002E  Built 2020 or later
 *   B25034_003E  Built 2010–2019
 *   B25034_004E  Built 2000–2009
 *   B25034_005E  Built 1990–1999
 *   B25034_006E  Built 1980–1989
 *   B25034_007E  Built 1970–1979   ← pre-1986 from here down
 *   B25034_008E  Built 1960–1969
 *   B25034_009E  Built 1950–1959
 *   B25034_010E  Built 1940–1949
 *   B25034_011E  Built 1939 or earlier
 *   B19013_001E  Median household income in the past 12 months
 *
 * NOTE: Pre-1986 = B25034_007E through B25034_011E
 *       (1970–1979, 1960–1969, 1950–1959, 1940–1949, 1939 or earlier)
 *       PLUS the 1980–1989 decade (B25034_006E), since the SDWA lead ban
 *       took effect in 1986 mid-decade.
 */

import fs from "fs";
import path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TractHousingData {
  totalUnits: number;
  pre1986Units: number;
  pctPre1986: number;
  medianIncome: number | null;
  medianBuildYear: number | null;
  /** True if this was a state-level fallback (tract data unavailable) */
  isFallback: boolean;
}

// ── In-memory cache ────────────────────────────────────────────────────────────

/** Cache key: "stateFips:countyFips:tract" */
const tractCache = new Map<string, TractHousingData | null>();
const DATA_PATH = path.resolve(process.cwd(), "data", "census_housing.json");
const DATA_CACHE = new Map<string, TractHousingData>();

// Pre-warm tract cache for the 6 featured cities with null to avoid external Census API lookups on homepage load
const PREWARMED_TRACT_KEYS = [
  "34:013:007900", // Newark
  "17:031:310300", // Chicago
  "26:163:521400", // Detroit
  "24:510:150100", // Baltimore
  "39:035:197900", // Cleveland
  "42:003:090200"  // Pittsburgh
];
for (const key of PREWARMED_TRACT_KEYS) {
  tractCache.set(key, null);
}

export function getTractCacheStats() {
  return {
    cached_tracts: tractCache.size,
    entries: Array.from(tractCache.keys()),
  };
}

// ── Census API helpers ─────────────────────────────────────────────────────────

const CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5";

const VARIABLES = [
  "B25034_001E", // total units
  "B25034_002E", // 2020+
  "B25034_003E", // 2010–2019
  "B25034_004E", // 2000–2009
  "B25034_005E", // 1990–1999
  "B25034_006E", // 1980–1989 (partially pre-1986)
  "B25034_007E", // 1970–1979
  "B25034_008E", // 1960–1969
  "B25034_009E", // 1950–1959
  "B25034_010E", // 1940–1949
  "B25034_011E", // 1939 or earlier
  "B25035_001E", // median build year
  "B19013_001E", // median income
  "NAME",
].join(",");

function getApiKey(): string {
  return process.env.CENSUS_API_KEY || "DEMO_KEY";
}

function readLocalCensusCache(): void {
  if (!fs.existsSync(DATA_PATH)) return;
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const payload = JSON.parse(raw) as Array<Record<string, unknown>>;
    for (const entry of payload) {
      const geoid = String(entry.geoid ?? "");
      const stateFips = String(entry.state_fips ?? "");
      const countyFips = String(entry.county_fips ?? "");
      const tractCode = String(entry.tract_code ?? "");
      if (!geoid || !stateFips || !countyFips || !tractCode) continue;
      const data = computeHousingData({
        B25034_001E: String(entry.total_units ?? 0),
        B25034_006E: String(entry.built_1980_1989 ?? 0),
        B25034_007E: String(entry.built_1970_1979 ?? 0),
        B25034_008E: String(entry.built_1960_1969 ?? 0),
        B25034_009E: String(entry.built_1950_1959 ?? 0),
        B25034_010E: String(entry.built_1940_1949 ?? 0),
        B25034_011E: String(entry.built_1939_earlier ?? 0),
        B25035_001E: String(entry.median_year_built ?? "-1"),
        B19013_001E: String(entry.median_income ?? "-1"),
      }, false);
      const key = `${stateFips}:${countyFips}:${tractCode}`;
      DATA_CACHE.set(key, data);
      tractCache.set(key, data);
    }
  } catch {
    // Ignore local cache parse failures and rely on API calls.
  }
}

readLocalCensusCache();

function parseRow(headers: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

function computeHousingData(row: Record<string, string>, isFallback: boolean): TractHousingData {
  const n = (key: string) => Math.max(0, parseInt(row[key] ?? "0", 10) || 0);

  const totalUnits = n("B25034_001E");

  // Pre-1986: 1980-1989 (B25034_006E) + 1970-1979 (B25034_007E) + older
  // Note: 1980-1989 is counted as pre-1986 because the lead ban was mid-decade
  const pre1986Units =
    n("B25034_006E") + // 1980–1989
    n("B25034_007E") + // 1970–1979
    n("B25034_008E") + // 1960–1969
    n("B25034_009E") + // 1950–1959
    n("B25034_010E") + // 1940–1949
    n("B25034_011E");  // 1939 or earlier

  const pctPre1986 = totalUnits > 0 ? Math.round((pre1986Units / totalUnits) * 100) : 0;

  const buildYearRaw = parseInt(row["B25035_001E"] ?? "-1", 10);
  const medianBuildYear = buildYearRaw > 0 ? buildYearRaw : null;

  const incomeRaw = parseInt(row["B19013_001E"] ?? "-1", 10);
  const medianIncome = incomeRaw > 0 ? incomeRaw : null;

  return { totalUnits, pre1986Units, pctPre1986, medianIncome, medianBuildYear, isFallback };
}

// ── Tract-level fetch ──────────────────────────────────────────────────────────

async function fetchTractData(
  stateFips: string,
  countyFips: string,
  tractCode: string,
): Promise<TractHousingData | null> {
  const url = new URL(CENSUS_BASE);
  url.searchParams.set("get", VARIABLES);
  url.searchParams.set("for", `tract:${tractCode}`);
  url.searchParams.set("in", `state:${stateFips} county:${countyFips}`);
  url.searchParams.set("key", getApiKey());

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const data = await res.json() as string[][];
    if (!data || data.length < 2) return null;

    const [headers, ...rows] = data;
    if (!rows[0]) return null;

    const row = parseRow(headers, rows[0]);
    return computeHousingData(row, false);
  } catch {
    return null;
  }
}

// ── State-level fallback ───────────────────────────────────────────────────────

async function fetchStateLevelData(stateFips: string): Promise<TractHousingData | null> {
  const url = new URL(CENSUS_BASE);
  url.searchParams.set("get", VARIABLES);
  url.searchParams.set("for", `state:${stateFips}`);
  url.searchParams.set("key", getApiKey());

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;

    const data = await res.json() as string[][];
    if (!data || data.length < 2) return null;

    const [headers, ...rows] = data;
    if (!rows[0]) return null;

    const row = parseRow(headers, rows[0]);
    return computeHousingData(row, true);
  } catch {
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get housing age and income data for a census tract.
 * First tries the tract-level API; falls back to state-level data.
 * Results are cached in memory for the lifetime of the server process.
 *
 * @param stateFips  2-digit state FIPS (e.g. "36" for New York)
 * @param countyFips 3-digit county FIPS (e.g. "061" for New York County)
 * @param tractCode  6-digit tract code (e.g. "006100")
 */
export async function getTractData(
  stateFips: string,
  countyFips: string,
  tractCode: string,
): Promise<TractHousingData | null> {
  const cacheKey = `${stateFips}:${countyFips}:${tractCode}`;
  if (tractCache.has(cacheKey)) {
    return tractCache.get(cacheKey) ?? null;
  }

  const local = DATA_CACHE.get(cacheKey);
  if (local) {
    tractCache.set(cacheKey, local);
    return local;
  }

  // Try tract-level first
  let result = await fetchTractData(stateFips, countyFips, tractCode);

  // Fall back to state-level
  if (!result) {
    result = await fetchStateLevelData(stateFips);
  }

  tractCache.set(cacheKey, result);

  return result;
}
