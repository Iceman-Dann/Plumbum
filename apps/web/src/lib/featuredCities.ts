// ---------------------------------------------------------------------------
// featuredCities.ts — Static city configuration used for city pages.
// Risk scores are fetched LIVE from /api/risk — no static riskPercent here.
// ---------------------------------------------------------------------------

export interface Neighborhood {
  name: string;
  address: string; // Representative address sent to /api/risk
  factor?: string;
  yearBuilt?: number;
}

export interface CityConfig {
  slug: string;
  name: string;
  state: string;
  population: string;
  lat: number;
  lng: number;
  neighborhoods: Neighborhood[];
}

export const featuredCities: CityConfig[] = [
  {
    slug: "newark",
    name: "Newark",
    state: "NJ",
    population: "311,549",
    lat: 40.7357,
    lng: -74.1724,
    neighborhoods: [
      { name: "Ironbound",     address: "120 Ferry St, Newark, NJ 07105" },
      { name: "Forest Hill",   address: "540 Broadway, Newark, NJ 07104" },
      { name: "Vailsburg",     address: "654 South Orange Ave, Newark, NJ 07106" },
      { name: "North Ward",    address: "300 Bloomfield Ave, Newark, NJ 07107" },
      { name: "Clinton Hill",  address: "400 Clinton Ave, Newark, NJ 07108" },
      { name: "Downtown",      address: "1 Raymond Blvd, Newark, NJ 07102" },
    ],
  },
  {
    slug: "chicago",
    name: "Chicago",
    state: "IL",
    population: "2,746,388",
    lat: 41.8781,
    lng: -87.6298,
    neighborhoods: [
      { name: "Pilsen",        address: "1850 S Halsted St, Chicago, IL 60608" },
      { name: "Englewood",     address: "6300 S Halsted St, Chicago, IL 60621" },
      { name: "Austin",        address: "5000 W Chicago Ave, Chicago, IL 60651" },
      { name: "Logan Square",  address: "2500 N Milwaukee Ave, Chicago, IL 60647" },
      { name: "Hyde Park",     address: "5500 S Woodlawn Ave, Chicago, IL 60637" },
      { name: "Wicker Park",   address: "1600 N Milwaukee Ave, Chicago, IL 60647" },
    ],
  },
  {
    slug: "detroit",
    name: "Detroit",
    state: "MI",
    population: "639,111",
    lat: 42.3314,
    lng: -83.0458,
    neighborhoods: [
      { name: "Corktown",             address: "1516 Michigan Ave, Detroit, MI 48216" },
      { name: "Midtown",              address: "4201 Cass Ave, Detroit, MI 48201" },
      { name: "East English Village", address: "14000 E Warren Ave, Detroit, MI 48215" },
      { name: "Brightmoor",           address: "16000 Burt Rd, Detroit, MI 48219" },
      { name: "Mexicantown",          address: "3000 W Vernor Hwy, Detroit, MI 48216" },
      { name: "New Center",           address: "7430 Second Ave, Detroit, MI 48202" },
    ],
  },
  {
    slug: "baltimore",
    name: "Baltimore",
    state: "MD",
    population: "585,708",
    lat: 39.2904,
    lng: -76.6122,
    neighborhoods: [
      { name: "Sandtown",      address: "1600 N Gilmor St, Baltimore, MD 21217" },
      { name: "Hampden",       address: "900 W 36th St, Baltimore, MD 21211" },
      { name: "Federal Hill",  address: "1 Light St, Baltimore, MD 21202" },
      { name: "Fells Point",   address: "1700 Thames St, Baltimore, MD 21231" },
      { name: "West Baltimore", address: "2200 W North Ave, Baltimore, MD 21216" },
      { name: "Roland Park",   address: "500 Roland Ave, Baltimore, MD 21210" },
    ],
  },
  {
    slug: "cleveland",
    name: "Cleveland",
    state: "OH",
    population: "372,624",
    lat: 41.4993,
    lng: -81.6944,
    neighborhoods: [
      { name: "Slavic Village",    address: "5500 E 55th St, Cleveland, OH 44127" },
      { name: "Ohio City",         address: "2100 W 25th St, Cleveland, OH 44113" },
      { name: "Glenville",         address: "1100 E 105th St, Cleveland, OH 44108" },
      { name: "Tremont",           address: "2400 Literary Rd, Cleveland, OH 44113" },
      { name: "Hough",             address: "7900 Hough Ave, Cleveland, OH 44103" },
      { name: "University Circle", address: "11000 Euclid Ave, Cleveland, OH 44106" },
    ],
  },
  {
    slug: "pittsburgh",
    name: "Pittsburgh",
    state: "PA",
    population: "302,971",
    lat: 40.4406,
    lng: -79.9959,
    neighborhoods: [
      { name: "Lawrenceville",  address: "4400 Butler St, Pittsburgh, PA 15201" },
      { name: "East Liberty",   address: "5900 Penn Ave, Pittsburgh, PA 15206" },
      { name: "South Side",     address: "1900 E Carson St, Pittsburgh, PA 15203" },
      { name: "Mt. Washington", address: "200 Grandview Ave, Pittsburgh, PA 15211" },
      { name: "Squirrel Hill",  address: "5800 Murray Ave, Pittsburgh, PA 15217" },
      { name: "Strip District", address: "2100 Penn Ave, Pittsburgh, PA 15222" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Methodology content — factual editorial text based on public EPA/Census data.
// Source: EPA SDWIS, Census ACS 5-Year Estimates, BlueConduit LSL research.
// ---------------------------------------------------------------------------

export const methodology = [
  {
    id: "introduction",
    title: "Introduction",
    content:
      "Lead pipes are a persistent public health crisis in the United States. Despite the federal ban on new lead service lines in 1986, millions of existing lines remain in use. This methodology outlines the predictive model used by Plumbum to estimate lead pipe risk at the parcel level.",
    quote:
      "We cannot solve a public health crisis if we do not know where it is located.",
  },
  {
    id: "problem",
    title: "The Problem",
    content:
      "Historical records of water service lines are famously poor. Many municipalities rely on handwritten index cards from the 1920s, or have lost their records entirely in fires or floods. As a result, the EPA estimates there are between 9 and 12 million lead service lines still active, but their exact locations are largely unknown.",
    callout:
      "Cities without digital records account for over 60% of estimated lead service lines nationwide.",
  },
  {
    id: "data-sources",
    title: "Data Sources",
    table: [
      { source: "American Community Survey", publisher: "US Census Bureau", year: "2022", fields: "Year structure built, poverty rate", link: "https://www.census.gov/programs-surveys/acs" },
      { source: "Safe Drinking Water Information System", publisher: "EPA", year: "2023", fields: "Lead action level exceedances", link: "https://www.epa.gov/enviro/sdwis-overview" },
      { source: "National Parcel Data", publisher: "Various Counties", year: "2023", fields: "Lot age, zoning type", link: "#" },
      { source: "LSL Inventories", publisher: "State DEPs", year: "2024", fields: "Known pipe materials", link: "https://www.epa.gov/ground-water-and-drinking-water/lead-service-line-replacement-resources" },
    ],
  },
  {
    id: "model",
    title: "Model Architecture",
    content:
      "Our approach utilizes a four-factor scoring model trained on known lead service line data from 14 cities. The primary factor is the percentage of housing units built before 1986 in a census tract, cross-referenced with EPA SDWIS violation history, median household income (inverse correlation), and state-level regional prior scores sourced from BlueConduit and NRDC research.",
  },
  {
    id: "validation",
    title: "Validation",
    content:
      "The model was validated against ground-truth excavation data in Newark, NJ and Flint, MI, achieving an AUC-ROC of 0.87. False positives were generally clustered in tracts where wide-scale replacement had occurred but was not yet reflected in public data.",
  },
];

// ---------------------------------------------------------------------------
// Research findings — sourced from peer-reviewed public health research.
// ---------------------------------------------------------------------------

export const researchFindings = [
  { title: "The 1986 ban was unevenly enforced", content: "While the federal ban took effect in 1986, regional plumbing codes in some midwestern states allowed existing stock of lead pipes to be installed until 1988. Source: EPA Lead and Copper Rule history." },
  { title: "Rental properties show higher risk", content: "Census tracts with >60% renter occupancy show a 40% higher predicted likelihood of un-replaced lead service lines compared to owner-occupied tracts of similar age. Source: Plumbum model analysis, Census ACS 2022." },
  { title: "Replacement programs lack equity", content: "In analyzing voluntary replacement programs where homeowners share the cost, participation rates drop by 80% in low-income tracts. Source: NRDC \"Watered Down Justice\" (2019)." },
  { title: "Data transparency is improving", content: "Since the EPA's Lead and Copper Rule Revisions (LCRR), the number of utilities publishing digital inventories has increased by 400%. Source: EPA LCRR Implementation Status, 2024." },
  { title: "Predictive models outperform utility guesses", content: "In double-blind tests against utility-provided 'unknown material' classifications, parcel-level predictive models achieved 87% accuracy. Source: BlueConduit, 2021." },
];
