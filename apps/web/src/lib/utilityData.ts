export interface UtilityInfo {
  name: string;
  foiaOfficerTitle: string;
  address: string;
  stateFoiaLaw: string;
  state: string;
}

/**
 * Keyed by the first 5 characters of the census tract (state FIPS + county FIPS).
 * Falls back to state-FIPS-only keys for broader coverage.
 */
const UTILITY_BY_COUNTY: Record<string, UtilityInfo> = {
  // ── Illinois ─────────────────────────────────────────────────────────────
  "17031": {
    name: "City of Chicago Department of Water Management",
    foiaOfficerTitle: "FOIA Officer, Department of Water Management",
    address: "1000 E. Ohio Street, Chicago, IL 60611",
    stateFoiaLaw: "Illinois Freedom of Information Act (5 ILCS 140/1 et seq.)",
    state: "IL",
  },

  // ── New Jersey ────────────────────────────────────────────────────────────
  "34013": {
    name: "Newark Department of Water & Sewer Utilities",
    foiaOfficerTitle: "Custodian of Public Records",
    address: "920 Broad Street, Room B-17, Newark, NJ 07102",
    stateFoiaLaw: "New Jersey Open Public Records Act (N.J.S.A. 47:1A-1 et seq.)",
    state: "NJ",
  },
  "34039": {
    name: "Middlesex Water Company",
    foiaOfficerTitle: "Records Custodian",
    address: "1500 Ronson Road, Iselin, NJ 08830",
    stateFoiaLaw: "New Jersey Open Public Records Act (N.J.S.A. 47:1A-1 et seq.)",
    state: "NJ",
  },

  // ── Michigan ──────────────────────────────────────────────────────────────
  "26163": {
    name: "Great Lakes Water Authority (GLWA) / Detroit Water and Sewerage Department",
    foiaOfficerTitle: "FOIA Coordinator",
    address: "735 Randolph Street, Detroit, MI 48226",
    stateFoiaLaw: "Michigan Freedom of Information Act (MCL 15.231 et seq.)",
    state: "MI",
  },
  "26049": {
    name: "City of Flint Water Treatment Plant",
    foiaOfficerTitle: "FOIA Coordinator, City of Flint",
    address: "1101 S. Saginaw Street, Flint, MI 48502",
    stateFoiaLaw: "Michigan Freedom of Information Act (MCL 15.231 et seq.)",
    state: "MI",
  },
  "26081": {
    name: "Jackson Water Utilities",
    foiaOfficerTitle: "FOIA Coordinator",
    address: "161 W. Michigan Avenue, Jackson, MI 49201",
    stateFoiaLaw: "Michigan Freedom of Information Act (MCL 15.231 et seq.)",
    state: "MI",
  },

  // ── Maryland ──────────────────────────────────────────────────────────────
  "24510": {
    name: "Baltimore City Department of Public Works — Bureau of Water and Wastewater",
    foiaOfficerTitle: "Maryland Public Information Act Officer",
    address: "Abel Wolman Municipal Building, 200 N. Holliday St., Baltimore, MD 21202",
    stateFoiaLaw: "Maryland Public Information Act (Md. Code, Gen. Prov. §§ 4-101 et seq.)",
    state: "MD",
  },

  // ── Ohio ──────────────────────────────────────────────────────────────────
  "39035": {
    name: "Cleveland Division of Water",
    foiaOfficerTitle: "Public Records Officer",
    address: "1201 Lakeside Avenue, Cleveland, OH 44114",
    stateFoiaLaw: "Ohio Public Records Act (R.C. § 149.43)",
    state: "OH",
  },
  "39061": {
    name: "Greater Cincinnati Water Works",
    foiaOfficerTitle: "Public Records Officer",
    address: "4747 Spring Grove Avenue, Cincinnati, OH 45232",
    stateFoiaLaw: "Ohio Public Records Act (R.C. § 149.43)",
    state: "OH",
  },
  "39153": {
    name: "City of Columbus Division of Water",
    foiaOfficerTitle: "Public Records Officer",
    address: "910 Dublin Road, Columbus, OH 43215",
    stateFoiaLaw: "Ohio Public Records Act (R.C. § 149.43)",
    state: "OH",
  },

  // ── Pennsylvania ──────────────────────────────────────────────────────────
  "42003": {
    name: "Pittsburgh Water and Sewer Authority",
    foiaOfficerTitle: "Right-to-Know Officer",
    address: "Penn Liberty Plaza I, 1200 Penn Avenue, Pittsburgh, PA 15222",
    stateFoiaLaw: "Pennsylvania Right-to-Know Law (65 P.S. § 67.101 et seq.)",
    state: "PA",
  },
  "42101": {
    name: "Philadelphia Water Department",
    foiaOfficerTitle: "Right-to-Know Officer",
    address: "1101 Market Street, 4th Floor, Philadelphia, PA 19107",
    stateFoiaLaw: "Pennsylvania Right-to-Know Law (65 P.S. § 67.101 et seq.)",
    state: "PA",
  },

  // ── Wisconsin ─────────────────────────────────────────────────────────────
  "55079": {
    name: "Milwaukee Water Works",
    foiaOfficerTitle: "Open Records Officer",
    address: "841 N. Broadway, Milwaukee, WI 53202",
    stateFoiaLaw: "Wisconsin Open Records Law (Wis. Stat. §§ 19.31–19.39)",
    state: "WI",
  },

  // ── New York ──────────────────────────────────────────────────────────────
  "36029": {
    name: "Buffalo Water Authority",
    foiaOfficerTitle: "Records Access Officer",
    address: "295 Main Street, Suite 350, Buffalo, NY 14203",
    stateFoiaLaw: "New York Freedom of Information Law (Public Officers Law §§ 84–90)",
    state: "NY",
  },
  "36061": {
    name: "New York City Department of Environmental Protection",
    foiaOfficerTitle: "Records Access Officer",
    address: "59-17 Junction Boulevard, Corona, NY 11368",
    stateFoiaLaw: "New York Freedom of Information Law (Public Officers Law §§ 84–90)",
    state: "NY",
  },
  "36047": {
    name: "New York City Department of Environmental Protection",
    foiaOfficerTitle: "Records Access Officer",
    address: "59-17 Junction Boulevard, Corona, NY 11368",
    stateFoiaLaw: "New York Freedom of Information Law (Public Officers Law §§ 84–90)",
    state: "NY",
  },

  // ── DC ────────────────────────────────────────────────────────────────────
  "11001": {
    name: "DC Water (District of Columbia Water and Sewer Authority)",
    foiaOfficerTitle: "FOIA Officer",
    address: "5000 Overlook Avenue SW, Washington, DC 20032",
    stateFoiaLaw: "DC Freedom of Information Act (D.C. Code § 2-531 et seq.)",
    state: "DC",
  },

  // ── Texas ─────────────────────────────────────────────────────────────────
  "48201": {
    name: "City of Houston Public Works — Water Operations",
    foiaOfficerTitle: "Public Information Officer",
    address: "611 Walker Street, 28th Floor, Houston, TX 77002",
    stateFoiaLaw: "Texas Public Information Act (Texas Gov't Code Ch. 552)",
    state: "TX",
  },
  "48113": {
    name: "City of Dallas Water Utilities",
    foiaOfficerTitle: "Public Information Officer",
    address: "1500 Marilla Street, Room 4B North, Dallas, TX 75201",
    stateFoiaLaw: "Texas Public Information Act (Texas Gov't Code Ch. 552)",
    state: "TX",
  },

  // ── Massachusetts ─────────────────────────────────────────────────────────
  "25025": {
    name: "Boston Water and Sewer Commission",
    foiaOfficerTitle: "Public Records Access Officer",
    address: "980 Harrison Avenue, Boston, MA 02119",
    stateFoiaLaw: "Massachusetts Public Records Law (M.G.L. c. 66, § 10)",
    state: "MA",
  },

  // ── Minnesota ─────────────────────────────────────────────────────────────
  "27053": {
    name: "Minneapolis Public Works — Water Treatment & Distribution",
    foiaOfficerTitle: "Data Practices Officer",
    address: "309 2nd Avenue South, Minneapolis, MN 55401",
    stateFoiaLaw: "Minnesota Government Data Practices Act (Minn. Stat. Ch. 13)",
    state: "MN",
  },

  // ── Missouri ──────────────────────────────────────────────────────────────
  "29510": {
    name: "St. Louis Water Division",
    foiaOfficerTitle: "Sunshine Law Custodian",
    address: "1640 S. Kingshighway Blvd., St. Louis, MO 63110",
    stateFoiaLaw: "Missouri Sunshine Law (Mo. Rev. Stat. § 610.010 et seq.)",
    state: "MO",
  },

  // ── Colorado ──────────────────────────────────────────────────────────────
  "08031": {
    name: "Denver Water",
    foiaOfficerTitle: "Open Records Officer",
    address: "1600 W. 12th Avenue, Denver, CO 80254",
    stateFoiaLaw: "Colorado Open Records Act (C.R.S. § 24-72-201 et seq.)",
    state: "CO",
  },

  // ── Washington State ──────────────────────────────────────────────────────
  "53033": {
    name: "Seattle Public Utilities — Water Services",
    foiaOfficerTitle: "Public Records Officer",
    address: "PO Box 34018, Seattle, WA 98124",
    stateFoiaLaw: "Washington Public Records Act (RCW 42.56)",
    state: "WA",
  },

  // ── Oregon ────────────────────────────────────────────────────────────────
  "41051": {
    name: "Portland Water Bureau",
    foiaOfficerTitle: "Public Records Officer",
    address: "1120 SW 5th Avenue, Room 405, Portland, OR 97204",
    stateFoiaLaw: "Oregon Public Records Law (ORS 192.311 et seq.)",
    state: "OR",
  },

  // ── Georgia ───────────────────────────────────────────────────────────────
  "13121": {
    name: "City of Atlanta Department of Watershed Management",
    foiaOfficerTitle: "Open Records Officer",
    address: "72 Marietta Street NW, Atlanta, GA 30303",
    stateFoiaLaw: "Georgia Open Records Act (O.C.G.A. § 50-18-70 et seq.)",
    state: "GA",
  },

  // ── California ────────────────────────────────────────────────────────────
  "06037": {
    name: "Los Angeles Department of Water and Power",
    foiaOfficerTitle: "Public Records Officer",
    address: "111 N. Hope Street, Los Angeles, CA 90012",
    stateFoiaLaw: "California Public Records Act (Gov. Code § 7920.000 et seq.)",
    state: "CA",
  },
  "06075": {
    name: "San Francisco Public Utilities Commission — Water Enterprise",
    foiaOfficerTitle: "Public Records Officer",
    address: "525 Golden Gate Avenue, 13th Floor, San Francisco, CA 94102",
    stateFoiaLaw: "California Public Records Act (Gov. Code § 7920.000 et seq.)",
    state: "CA",
  },
};

/** State-level FOIA law names for the generic fallback */
const STATE_FOIA_LAW: Record<string, string> = {
  AL: "Alabama Open Records Act (Ala. Code § 36-12-40)",
  AK: "Alaska Public Records Act (AS 40.25.110)",
  AZ: "Arizona Public Records Law (A.R.S. § 39-121)",
  AR: "Arkansas Freedom of Information Act (Ark. Code § 25-19-101)",
  CA: "California Public Records Act (Gov. Code § 7920.000)",
  CO: "Colorado Open Records Act (C.R.S. § 24-72-201)",
  CT: "Connecticut Freedom of Information Act (Conn. Gen. Stat. § 1-200)",
  DE: "Delaware Freedom of Information Act (29 Del. C. § 10001)",
  FL: "Florida Public Records Law (Fla. Stat. § 119.01)",
  GA: "Georgia Open Records Act (O.C.G.A. § 50-18-70)",
  HI: "Hawaii Uniform Information Practices Act (HRS § 92F-11)",
  ID: "Idaho Public Records Law (Idaho Code § 74-101)",
  IL: "Illinois Freedom of Information Act (5 ILCS 140/1)",
  IN: "Indiana Access to Public Records Act (IC 5-14-3)",
  IA: "Iowa Open Records Law (Iowa Code § 22.1)",
  KS: "Kansas Open Records Act (K.S.A. § 45-215)",
  KY: "Kentucky Open Records Act (KRS 61.870)",
  LA: "Louisiana Public Records Law (La. R.S. 44:1)",
  ME: "Maine Freedom of Access Act (1 M.R.S. § 401)",
  MD: "Maryland Public Information Act (Md. Code, Gen. Prov. §§ 4-101)",
  MA: "Massachusetts Public Records Law (M.G.L. c. 66, § 10)",
  MI: "Michigan Freedom of Information Act (MCL 15.231)",
  MN: "Minnesota Government Data Practices Act (Minn. Stat. Ch. 13)",
  MS: "Mississippi Public Records Act (Miss. Code Ann. § 25-61-1)",
  MO: "Missouri Sunshine Law (Mo. Rev. Stat. § 610.010)",
  MT: "Montana Constitutional Right to Know (Mont. Const. Art. II, § 9)",
  NE: "Nebraska Public Records Statutes (Neb. Rev. Stat. § 84-712)",
  NV: "Nevada Public Records Act (NRS 239.010)",
  NH: "New Hampshire Right-to-Know Law (RSA 91-A:1)",
  NJ: "New Jersey Open Public Records Act (N.J.S.A. 47:1A-1)",
  NM: "New Mexico Inspection of Public Records Act (NMSA § 14-2-1)",
  NY: "New York Freedom of Information Law (Public Officers Law §§ 84-90)",
  NC: "North Carolina Public Records Law (N.C.G.S. § 132-1)",
  ND: "North Dakota Open Records Law (N.D.C.C. § 44-04-18)",
  OH: "Ohio Public Records Act (R.C. § 149.43)",
  OK: "Oklahoma Open Records Act (51 O.S. § 24A.1)",
  OR: "Oregon Public Records Law (ORS 192.311)",
  PA: "Pennsylvania Right-to-Know Law (65 P.S. § 67.101)",
  RI: "Rhode Island Access to Public Records Act (R.I. Gen. Laws § 38-2-1)",
  SC: "South Carolina Freedom of Information Act (S.C. Code § 30-4-10)",
  SD: "South Dakota Open Records Law (SDCL § 1-27-1)",
  TN: "Tennessee Public Records Act (Tenn. Code Ann. § 10-7-503)",
  TX: "Texas Public Information Act (Texas Gov't Code Ch. 552)",
  UT: "Utah Government Records Access and Management Act (Utah Code § 63G-2-101)",
  VT: "Vermont Access to Public Records Act (1 V.S.A. § 315)",
  VA: "Virginia Freedom of Information Act (Va. Code § 2.2-3700)",
  WA: "Washington Public Records Act (RCW 42.56)",
  WV: "West Virginia Freedom of Information Act (W. Va. Code § 29B-1-1)",
  WI: "Wisconsin Open Records Law (Wis. Stat. §§ 19.31-19.39)",
  WY: "Wyoming Public Records Act (Wyo. Stat. § 16-4-201)",
  DC: "DC Freedom of Information Act (D.C. Code § 2-531)",
};

/** State abbreviation by state FIPS code */
const STATE_BY_FIPS: Record<string, string> = {
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
  "56": "WY",
};

export function lookupUtility(censusTract: string): UtilityInfo | null {
  if (!censusTract || censusTract.length < 5) return null;
  const countyKey = censusTract.slice(0, 5);
  if (UTILITY_BY_COUNTY[countyKey]) return UTILITY_BY_COUNTY[countyKey];
  return null;
}

/** Spanish names for state public records laws */
const STATE_FOIA_LAW_ES: Record<string, string> = {
  AL: "Ley de Registros Abiertos de Alabama (Ala. Code § 36-12-40)",
  AK: "Ley de Registros Públicos de Alaska (AS 40.25.110)",
  AZ: "Ley de Registros Públicos de Arizona (A.R.S. § 39-121)",
  AR: "Ley de Libertad de Información de Arkansas (Ark. Code § 25-19-101)",
  CA: "Ley de Registros Públicos de California (Gov. Code § 7920.000)",
  CO: "Ley de Registros Abiertos de Colorado (C.R.S. § 24-72-201)",
  CT: "Ley de Libertad de Información de Connecticut (Conn. Gen. Stat. § 1-200)",
  DE: "Ley de Libertad de Información de Delaware (29 Del. C. § 10001)",
  FL: "Ley de Registros Públicos de Florida (Fla. Stat. § 119.01)",
  GA: "Ley de Registros Abiertos de Georgia (O.C.G.A. § 50-18-70)",
  HI: "Ley Uniforme de Prácticas de Información de Hawái (HRS § 92F-11)",
  ID: "Ley de Registros Públicos de Idaho (Idaho Code § 74-101)",
  IL: "Ley de Libertad de Información de Illinois (5 ILCS 140/1)",
  IN: "Ley de Acceso a Registros Públicos de Indiana (IC 5-14-3)",
  IA: "Ley de Registros Abiertos de Iowa (Iowa Code § 22.1)",
  KS: "Ley de Registros Abiertos de Kansas (K.S.A. § 45-215)",
  KY: "Ley de Registros Abiertos de Kentucky (KRS 61.870)",
  LA: "Ley de Registros Públicos de Luisiana (La. R.S. 44:1)",
  ME: "Ley de Libertad de Acceso de Maine (1 M.R.S. § 401)",
  MD: "Ley de Información Pública de Maryland (Md. Code, Gen. Prov. §§ 4-101)",
  MA: "Ley de Registros Públicos de Massachusetts (M.G.L. c. 66, § 10)",
  MI: "Ley de Libertad de Información de Míchigan (MCL 15.231)",
  MN: "Ley de Prácticas de Datos Gubernamentales de Minnesota (Minn. Stat. Ch. 13)",
  MS: "Ley de Registros Públicos de Misisipi (Miss. Code Ann. § 25-61-1)",
  MO: "Ley Sunshine de Misuri (Mo. Rev. Stat. § 610.010)",
  MT: "Derecho Constitucional a Saber de Montana (Mont. Const. Art. II, § 9)",
  NE: "Estatutos de Registros Públicos de Nebraska (Neb. Rev. Stat. § 84-712)",
  NV: "Ley de Registros Públicos de Nevada (NRS 239.010)",
  NH: "Ley de Derecho a Saber de Nuevo Hampshire (RSA 91-A:1)",
  NJ: "Ley de Registros Públicos Abiertos de Nueva Jersey (N.J.S.A. 47:1A-1)",
  NM: "Ley de Inspección de Registros Públicos de Nuevo México (NMSA § 14-2-1)",
  NY: "Ley de Libertad de Información de Nueva York (Public Officers Law §§ 84-90)",
  NC: "Ley de Registros Públicos de Carolina del Norte (N.C.G.S. § 132-1)",
  ND: "Ley de Registros Abiertos de Dakota del Norte (N.D.C.C. § 44-04-18)",
  OH: "Ley de Registros Públicos de Ohio (R.C. § 149.43)",
  OK: "Ley de Registros Abiertos de Oklahoma (51 O.S. § 24A.1)",
  OR: "Ley de Registros Públicos de Oregón (ORS 192.311)",
  PA: "Ley de Derecho a Saber de Pensilvania (65 P.S. § 67.101)",
  RI: "Ley de Acceso a Registros Públicos de Rhode Island (R.I. Gen. Laws § 38-2-1)",
  SC: "Ley de Libertad de Información de Carolina del Sur (S.C. Code § 30-4-10)",
  SD: "Ley de Registros Abiertos de Dakota del Sur (SDCL § 1-27-1)",
  TN: "Ley de Registros Públicos de Tennessee (Tenn. Code Ann. § 10-7-503)",
  TX: "Ley de Información Pública de Texas (Texas Gov't Code Ch. 552)",
  UT: "Ley de Acceso y Gestión de Registros Gubernamentales de Utah (Utah Code § 63G-2-101)",
  VT: "Ley de Acceso a Registros Públicos de Vermont (1 V.S.A. § 315)",
  VA: "Ley de Libertad de Información de Virginia (Va. Code § 2.2-3700)",
  WA: "Ley de Registros Públicos de Washington (RCW 42.56)",
  WV: "Ley de Libertad de Información de Virginia Occidental (W. Va. Code § 29B-1-1)",
  WI: "Ley de Registros Abiertos de Wisconsin (Wis. Stat. §§ 19.31-19.39)",
  WY: "Ley de Registros Públicos de Wyoming (Wyo. Stat. § 16-4-201)",
  DC: "Ley de Libertad de Información del Distrito de Columbia (D.C. Code § 2-531)",
};

export function getStateFoiaLaw(censusTract: string, lang: "en" | "es" = "en"): string {
  const stateFips = censusTract?.slice(0, 2) ?? "";
  const abbr = STATE_BY_FIPS[stateFips] ?? "";
  if (lang === "es") {
    return STATE_FOIA_LAW_ES[abbr] ?? "la ley estatal de registros públicos aplicable";
  }
  return STATE_FOIA_LAW[abbr] ?? "applicable state public records law";
}

export function getGenericUtility(censusTract: string): UtilityInfo {
  const stateFips = censusTract?.slice(0, 2) ?? "";
  const abbr = STATE_BY_FIPS[stateFips] ?? "";
  return {
    name: "Your Local Water Utility",
    foiaOfficerTitle: "FOIA / Public Records Officer",
    address: "[Water Utility Address — look up at water.epa.gov/infrastructure/drinkingwater/dws/]",
    stateFoiaLaw: STATE_FOIA_LAW[abbr] ?? "applicable state public records law",
    state: abbr,
  };
}
