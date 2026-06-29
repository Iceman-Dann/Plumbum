/**
 * State-level lead pipe risk priors (Factor 4 of the scoring engine).
 * Based on documented lead service line prevalence, historical violations,
 * and infrastructure age across states with well-known lead pipe problems.
 *
 * Points scale: 0–25 (contributes to the 0–100 total score).
 * Michigan/New Jersey/Illinois top the list due to documented widespread
 * lead service line infrastructure and high-profile incidents.
 *
 * Source references:
 *  - EPA Lead and Copper Rule compliance data
 *  - BlueConduit lead service line inventory estimates (2021)
 *  - NRDC "Watered Down Justice" (2019)
 */

/** Map of 2-letter state abbreviation → base risk score (0–25) */
export const STATE_RISK_PRIORS: Record<string, number> = {
  MI: 20, // Michigan — Flint crisis; highest known LSL concentration
  NJ: 18, // New Jersey — statewide mandatory LSL replacement underway
  IL: 17, // Illinois — Chicago has one of largest LSL inventories in US
  OH: 17, // Ohio — Toledo water crisis; large aging industrial cities
  PA: 16, // Pennsylvania — Pittsburgh; Philadelphia older housing stock
  MD: 15, // Maryland — Baltimore aging infrastructure
  NY: 14, // New York — pre-war housing stock; NYC > 400k estimated LSLs
  WI: 14, // Wisconsin — Milwaukee has replaced <20% of LSLs
  IN: 13, // Indiana — Indianapolis aging municipal system
  MN: 12, // Minnesota — Minneapolis older neighborhoods
  MA: 12, // Massachusetts — Boston Fenway, older dense neighborhoods
  CT: 11, // Connecticut — Hartford, Bridgeport older systems
  RI: 11, // Rhode Island — Providence aging infrastructure
  DE: 10, // Delaware — Wilmington aging systems
  MO: 10, // Missouri — St. Louis elevated risk
  KY: 10, // Kentucky — Louisville aging infrastructure
  WV: 10, // West Virginia — rural aging systems
  VA: 9,  // Virginia — Richmond older neighborhoods
  NC: 8,  // North Carolina — older cities
  TN: 8,  // Tennessee — Memphis aging system
  SC: 7,  // South Carolina — Charleston older stock
  LA: 7,  // Louisiana — New Orleans pre-war housing
  AL: 7,  // Alabama — Birmingham aging system
  GA: 6,  // Georgia — Atlanta newer; but older neighborhoods elevated
};

/** FIPS state code (2-digit string, e.g. "26") → state abbreviation */
export const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "72": "PR",
};

/** Default score for states not in the explicit list */
export const DEFAULT_STATE_SCORE = 5;

/**
 * Get the regional risk prior score (0–25) for a US state FIPS code.
 * @param stateFips 2-digit state FIPS (e.g. "26" for Michigan)
 */
export function getStatePriorScore(stateFips: string): number {
  const abbr = FIPS_TO_STATE[stateFips];
  if (!abbr) return DEFAULT_STATE_SCORE;
  return STATE_RISK_PRIORS[abbr] ?? DEFAULT_STATE_SCORE;
}

/**
 * Get the state name for display in factor detail text.
 */
export function getStateName(stateFips: string): string {
  const names: Record<string, string> = {
    "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
    "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
    "11": "Washington DC", "12": "Florida", "13": "Georgia", "15": "Hawaii",
    "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
    "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
    "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
    "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
    "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
    "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
    "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
    "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
    "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
    "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming", "72": "Puerto Rico",
  };
  return names[stateFips] ?? "this state";
}
