<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:8B3A2A,100:C1442D&height=220&section=header&text=Plumbum&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Know%20what%27s%20in%20your%20water.&descAlignY=58&descSize=20" width="100%" />

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=3000&pause=800&color=C1442D&center=true&vCenter=true&width=650&lines=Free.+Open-source.+No+ads.+No+tracking.;Type+any+US+address+%E2%86%92+get+a+lead+risk+score.;EPA+%2B+Census+%2B+HUD+%2B+USGS+%E2%80%94+all+public+data.;Built+so+every+family+can+check+their+tap." alt="Typing SVG" />

<br/>

<p>
  <img src="https://img.shields.io/badge/status-active--development-C1442D?style=for-the-badge&labelColor=1a1a1a" />
  <img src="https://img.shields.io/badge/license-MIT-8B3A2A?style=for-the-badge&labelColor=1a1a1a" />
  <img src="https://img.shields.io/badge/data-EPA%20%7C%20Census%20%7C%20HUD%20%7C%20USGS-C1442D?style=for-the-badge&labelColor=1a1a1a" />
  <img src="https://img.shields.io/badge/cost-%240%20forever-8B3A2A?style=for-the-badge&labelColor=1a1a1a" />
</p>

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/pnpm-Workspace-F69220?style=flat-square&logo=pnpm&logoColor=white" />
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet&logoColor=white" />
  <img src="https://img.shields.io/badge/i18n-EN%20%2F%20ES-C1442D?style=flat-square" />
</p>

<br/>

<a href="#what-it-does">What It Does</a> •
<a href="#the-problem-it-solves">The Problem</a> •
<a href="#how-it-works">How It Works</a> •
<a href="#architecture">Architecture</a> •
<a href="#tech-stack">Tech Stack</a> •
<a href="#getting-started">Getting Started</a> •
<a href="#api">API</a> •
<a href="#browser-extension">Extension</a> •
<a href="#contributing">Contributing</a>

</div>

<br/>

<div align="center">
<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>
</div>

<br/>

> **In one sentence:** type in any US address, and Plumbum tells you — in plain English, for free, with no account needed — whether the water coming out of that home's tap is likely to contain lead.

<br/>

## <img src="https://api.iconify.design/ph:drop-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> What It Does

**Plumbum** is a free, open-source public health tool that tells anyone in the US whether their home's drinking water is at risk from lead contamination — in under 3 seconds, with zero sign-up required.

You type an address. Plumbum pulls from **EPA enforcement records, US Census housing data, HUD redlining maps, and USGS geological surveys** to compute a personalized lead risk score. You get:

<table>
<tr>
<td width="32" align="center"><img src="https://api.iconify.design/ph:gauge-fill.svg?color=%23C1442D" width="22"/></td>
<td>A <strong>composite lead risk score</strong> (0–100) with a clear risk tier: Low / Moderate / Elevated / High</td>
</tr>
<tr>
<td align="center"><img src="https://api.iconify.design/ph:map-trifold-fill.svg?color=%23C1442D" width="22"/></td>
<td>An <strong>interactive pipe-material heatmap</strong> for your neighborhood and nearby schools</td>
</tr>
<tr>
<td align="center"><img src="https://api.iconify.design/ph:file-text-fill.svg?color=%23C1442D" width="22"/></td>
<td>An <strong>AI-translated Consumer Confidence Report</strong> — your utility's annual water report, in plain English (and Spanish)</td>
</tr>
<tr>
<td align="center"><img src="https://api.iconify.design/ph:envelope-simple-fill.svg?color=%23C1442D" width="22"/></td>
<td><strong>Ready-to-send advocacy documents</strong> — FOIA requests, landlord notices, pediatrician letters, and free-filter demand letters, auto-filled with your address and risk data</td>
</tr>
<tr>
<td align="center"><img src="https://api.iconify.design/ph:puzzle-piece-fill.svg?color=%23C1442D" width="22"/></td>
<td>A <strong>browser extension</strong> that shows your risk score directly on Zillow and Redfin listings while you browse</td>
</tr>
</table>

<br/>

## <img src="https://api.iconify.design/ph:warning-fill.svg?color=%238B3A2A" width="24" height="24" valign="middle"/> The Problem It Solves

<table>
<tr>
<td width="50%" valign="top">

### The reality of lead in US water
- An estimated **9+ million** US households are still served by lead pipes
- Utilities are legally required to disclose water quality — but bury it in a dense annual PDF almost nobody reads, called a Consumer Confidence Report (CCR)
- Most renters never even receive their building's CCR
- Homebuyers and renters have almost **no practical way to check lead risk** before signing a lease or closing on a house
- Existing tools are paywalled, ad-choked, or simply don't cover most US cities

</td>
<td width="50%" valign="top">

### What was missing
- A single, free tool that just answers: *"Is my tap water safe from lead?"*
- Something that **works for renters**, not just homeowners
- Support in **Spanish**, for families who are underserved by English-only tools
- A way to **hold landlords accountable** when they ignore water quality concerns
- A resource **journalists and researchers** can use to investigate patterns of lead exposure

</td>
</tr>
</table>

### How Plumbum fixes it

| Before Plumbum | With Plumbum |
|---|---|
| CCR buried in a utility PDF, written in legal and technical jargon | Plain-English (and Spanish) AI summary of your utility's report |
| No way to check risk before renting or buying | Instant risk score for any US address — no sign-up |
| Zillow/Redfin show square footage but not lead risk | Browser extension shows a risk badge on every listing you browse |
| Filing a lead complaint usually requires a lawyer | One-click FOIA request, auto-filled with your address and risk data |
| No neighborhood-level data for schools | Interactive map of lead risk at nearby schools and daycares |
| Renters have no leverage with landlords | Generates a formal landlord notice, with public compliance tracking |

<br/>

## <img src="https://api.iconify.design/ph:gear-six-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> How It Works

### The risk score engine

Plumbum's scoring model is a **Gradient Boosted Machine (GBM)** trained on public data, weighted roughly like this:

| Signal | Weight | Why it matters |
|---|---|---|
| Pipe material era | Highest | Homes built before the 1986 federal lead ban are far more likely to have lead service lines |
| Home build year & housing stock age | High | Older housing stock correlates strongly with lead plumbing and fixtures |
| Utility violation history (EPA SDWIS) | Medium | A history of lead/copper rule violations signals ongoing risk in the water system |
| Neighborhood redlining correlation (HUD) | Lower | Historically redlined areas were systematically denied infrastructure investment, including pipe replacement |

When you search an address, the server:

1. **Geocodes** the address using Census TIGER/Line data
2. **Fetches Census tract** demographics and housing vintage
3. **Cross-references EPA SDWIS** for utility violation history and enforcement actions
4. **Pulls HUD HOLC redlining grades** to surface historical infrastructure disinvestment
5. **Queries USGS** for regional water corrosivity (naturally soft or acidic water leaches lead faster)
6. Combines every signal into a single **0–100 risk score**, returned in real time

The full breakdown lives at **`/methodology`**.

### The CCR translation pipeline

Your utility publishes an annual **Consumer Confidence Report (CCR)** — a legally required document that is almost unreadable to a normal person. Plumbum:

1. Fetches the CCR PDF from EPA's public registry
2. Extracts the violation data and lead/copper test results
3. Sends it to **Llama 3.3 70B via Groq** for plain-language summarization
4. Returns a bilingual (EN/ES) summary next to your risk score

### The accountability registry

When a tenant sends a landlord notice through Plumbum, it's logged anonymously in a **Supabase-backed community database**. From there, anyone can:
- See which landlords have **refused** to test or remediate
- Track properties with **confirmed positive** lead tests
- Submit their own DIY water test result to grow the public dataset

<br/>

## <img src="https://api.iconify.design/ph:tree-structure-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Architecture

```mermaid
flowchart LR
    subgraph Client["apps/web — React + Vite"]
        A[Search Bar] --> B[Result Page]
        B --> C[PDF Report Generator]
        B --> D["Letter Generators<br/>FOIA · Landlord · Pediatrician · Filter"]
        B --> E["Interactive Maps<br/>Leaflet: city / schools / hotspots"]
    end

    subgraph Ext["extension/ — Browser Extension"]
        F[Zillow / Redfin Badge Injection] --> B
    end

    subgraph Server["apps/server — API"]
        G["/api/risk"] --> H[GBM Scoring Model]
        I["/api/accountability"] --> J[(Crowdsourced Registry)]
        K["/api/ccr"] --> L[Groq LLM Translation]
        M["/api/schools"] --> N[Google Places API]
        O["/api/real-estate"] --> P[Listing Risk Lookup]
    end

    subgraph Data["External Open Data"]
        Q[(EPA SDWIS)]
        R[(Census TIGER)]
        S[(HUD HOLC)]
        T[(USGS)]
        U[(Google Places)]
        V[(Groq / Llama 3.3)]
    end

    A -->|address query| G
    H --> Q & R & S & T
    K --> V
    M --> U
    B --> I
    F --> O

    style Client fill:#fdf1ee,stroke:#C1442D,stroke-width:2px
    style Ext fill:#fdf1ee,stroke:#C1442D,stroke-width:2px
    style Server fill:#f3d9d2,stroke:#8B3A2A,stroke-width:2px
    style Data fill:#ffffff,stroke:#8B3A2A,stroke-width:1px,stroke-dasharray: 4 4
```

<br/>

## <img src="https://api.iconify.design/ph:map-pin-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Site Map

| Route | Purpose |
|---|---|
| `/` | Hero search, featured cities, state risk map, live accountability ticker, API playground |
| `/result` | Full report — score ring, risk factors, heatmap, CCR translation, 6 action tabs, PDF export |
| `/listing-result` | Extension-driven result page for real-estate listing URLs |
| `/schools` | Lead risk for nearby schools & daycares, interactive map |
| `/hotspots` | Live city leaderboard by search volume & average risk score |
| `/accountability` | Crowdsourced landlord compliance registry |
| `/city/:slug` | Neighborhood-level deep dive for a specific city |
| `/research` | Journalist tools — budget tracker, redlining correlation, FOIA & press-pitch generators |
| `/methodology` | Full explainer of how the GBM scoring model works |
| `/api-docs` | Live interactive API explorer |
| `/extension` | Browser extension install guide & developer docs |
| `/data` | Open dataset of anonymized, crowdsourced water test results |

<br/>

## <img src="https://api.iconify.design/ph:lightning-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Key Capabilities

<div align="center">

| Feature | Description |
|:---:|---|
| **Live risk scoring** | GBM model scores any US address in real time against 4 open data sources |
| **AI CCR translation** | Llama 3.3 70B summarizes your utility's PDF water report into plain English/Spanish |
| **PDF reports** | Branded, bilingual `jsPDF` reports, one click to download |
| **Document generators** | FOIA request, landlord notice, pediatrician letter, free-filter demand |
| **Pregnancy mode** | Elevated warnings surfaced site-wide when toggled — lower safe thresholds applied |
| **Crowdsource database** | Community-submitted pipe material & DIY water test verification |
| **Landlord registry** | Anonymous compliance tracking — refused, pending, tested positive/negative |
| **Browser extension** | Shows risk badges directly on Zillow / Redfin listings while you browse |
| **Schools map** | Nearby schools and daycares scored and pinned on an interactive map |
| **Hotspot leaderboard** | Real-time ranking of cities by search activity and average risk |
| **Representative lookup** | Finds your local, state, and federal reps to contact about water issues |
| **Alert subscriptions** | Email alerts when your utility issues a new lead violation |
| **EN / ES bilingual** | Full parity across every page and generated document |

</div>

<br/>

## <img src="https://api.iconify.design/ph:stack-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Tech Stack

<div align="center">

![React](https://skillicons.dev/icons?i=react,ts,vite,supabase,nodejs,pnpm,css,html)

</div>

```
Frontend   → React 18 · TypeScript · Vite · CSS Modules · Leaflet · wouter (routing)
Backend    → Node.js · Express-style routes · Supabase (Postgres) · Drizzle ORM
AI / ML    → Groq API · Llama 3.3 70B (CCR summaries) · GBM risk model
External   → EPA SDWIS · Census TIGER · HUD HOLC · USGS · Google Places · Google Civic
Tooling    → pnpm workspaces · shared tsconfig base · cross-env
Extension  → Manifest V3 browser extension (Zillow/Redfin badge injection)
i18n       → Custom EN/ES translation layer (lib/translations)
PDF/Docs   → jsPDF-based letter & report generation
Alerts     → SendGrid email subscriptions
```

<br/>

## <img src="https://api.iconify.design/ph:folder-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Monorepo Structure

```text
Plumbum/
├── apps/
│   ├── web/                  # React + Vite frontend
│   │   └── src/
│   │       ├── pages/        # 13 routed pages (home, result, schools, etc.)
│   │       ├── components/   # UI components, maps, letter generators, demos
│   │       ├── hooks/        # PDF gen, letter gen, translation, stats
│   │       └── lib/          # translations, featured cities, shared utils
│   └── server/               # API server
│       └── src/
│           └── routes/       # /api/risk, /api/accountability, /api/ccr,
│                             # /api/schools, /api/real-estate, /api/hotspots,
│                             # /api/representatives, /api/subscribe, etc.
├── extension/                # Manifest V3 browser extension
│   ├── content.js            # Badge injection into Zillow/Redfin DOM
│   ├── popup.html/js/css     # Extension popup UI
│   ├── background.js         # Service worker
│   └── manifest.json
├── packages/                 # Shared workspace packages
├── data/                     # Static server-side reference data
├── lib/                      # Shared library code across workspace
├── scripts/                  # Build & deploy utilities
├── supabase_setup.md         # Database schema and Supabase configuration guide
└── pnpm-workspace.yaml       # pnpm monorepo workspace config
```

<br/>

## <img src="https://api.iconify.design/ph:rocket-launch-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18 | JavaScript runtime |
| [pnpm](https://pnpm.io/) | ≥ 8 | Package manager & workspace orchestration |
| [Supabase account](https://supabase.com/) | — | Postgres database (free tier works) |

```bash
npm install -g pnpm
```

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/plumbum.git
cd plumbum
```

### 2. Install dependencies

```bash
pnpm install
```

This installs dependencies for **every workspace** (`apps/web`, `apps/server`, `packages/`) in one command.

### 3. Configure environment variables

Create a `.env` file at the **project root**:

```env
# ── Supabase (Required) ─────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_KEY="your-anon-or-service-role-key"

# ── Google APIs (Required for school lookup & representative finder) ─────
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
GOOGLE_CIVIC_API_KEY="your-google-civic-api-key"

# ── Groq (Required for AI CCR translation) ───────────────────────────────
GROQ_API_KEY="your-groq-api-key"

# ── Census (Optional — falls back to DEMO_KEY, ~500 req/day limit) ───────
CENSUS_API_KEY="your-census-api-key"

# ── SendGrid (Optional — for alert email subscriptions) ──────────────────
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="contact@plumbummap.org"

# ── Encryption (for subscriber tokens) ───────────────────────────────────
ENCRYPTION_KEY="your-32-byte-hex-key"
```

**Where to get free API keys:**

| Key | Link | Notes |
|---|---|---|
| Supabase | [supabase.com](https://supabase.com) | Free tier — 500 MB DB included |
| Census | [api.census.gov/data/key_signup.html](https://api.census.gov/data/key_signup.html) | Free, generous rate limits |
| Groq | [console.groq.com](https://console.groq.com) | Free tier available |
| Google Places | [console.cloud.google.com](https://console.cloud.google.com) | $200 free credit/month |
| Google Civic | [console.cloud.google.com](https://console.cloud.google.com) | Free, no billing required |

### 4. Set up the database

Run the schema from [`supabase_setup.md`](./supabase_setup.md) in your [Supabase SQL Editor](https://app.supabase.com). This creates:
- `test_results` — community-submitted DIY water test data
- `landlord_notices` — crowdsourced landlord compliance registry

### 5. Run the dev servers

**Terminal 1 — Frontend (port 5173):**
```bash
pnpm dev:web
```

**Terminal 2 — Backend (port 8080):**
```bash
pnpm dev:server
```

> The frontend proxies API requests to `localhost:8080` automatically. Open **http://localhost:5173**.

### 6. Install the browser extension (optional)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Visit any Zillow or Redfin listing — a Plumbum risk badge appears on the property card

<br/>

## <img src="https://api.iconify.design/ph:plug-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> API

The server exposes a REST API on port `8080`. Full interactive docs live at **`/api-docs`** once the server is running.

**`GET /api/risk`** — lead risk score for an address
```bash
GET /api/risk?address=123+Main+St,+Chicago,+IL
```
```json
{
  "score": 72,
  "riskLevel": "elevated",
  "factors": {
    "pipeEra": "pre-1986",
    "buildYear": 1958,
    "violationHistory": 3,
    "redliningCorrelation": "high",
    "geologicalCorrosivity": "moderate"
  },
  "tract": "17031330100",
  "coordinates": { "lat": 41.8827, "lng": -87.6233 }
}
```

| Endpoint | Purpose |
|---|---|
| `GET /api/ccr` | Plain-language AI translation of a utility's CCR |
| `GET /api/schools` | Nearby schools/daycares with individual risk scores |
| `GET /api/hotspots` | City leaderboard by search volume & average risk |
| `POST /api/accountability` | Submit a landlord compliance notice |
| `GET /api/real-estate` | Score a listing URL directly (used by the extension) |
| `GET /api/representatives` | Local, state, and federal reps for an address |

<br/>

## <img src="https://api.iconify.design/ph:puzzle-piece-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Browser Extension

The Plumbum extension shows a **color-coded lead risk badge** on every property card you browse on Zillow and Redfin.

<div align="center">
  <img src="apps/web/public/extension-screenshot.png" alt="Plumbum browser extension risk badge on a Zillow listing" width="800" style="max-width:100%;border-radius:12px;" />
</div>

<br/>

**What it does**
- Detects Zillow and Redfin listing pages automatically
- Extracts the property address from the page
- Calls `/api/real-estate` to fetch a risk score in the background
- Shows a badge directly on the listing:

<p align="center">
<img src="https://api.iconify.design/ph:circle-fill.svg?color=%23639922" width="14"/> Low &nbsp;&nbsp;
<img src="https://api.iconify.design/ph:circle-fill.svg?color=%23BA7517" width="14"/> Moderate &nbsp;&nbsp;
<img src="https://api.iconify.design/ph:circle-fill.svg?color=%23D85A30" width="14"/> Elevated &nbsp;&nbsp;
<img src="https://api.iconify.design/ph:circle-fill.svg?color=%23A32D2D" width="14"/> High
</p>

- Clicking the badge opens the full Plumbum report for that address

**Extension structure**
```
extension/
├── manifest.json       # Manifest V3 — permissions: zillow.com, redfin.com
├── content.js          # Badge injection logic (runs on listing pages)
├── background.js       # Service worker — handles API calls from content script
├── popup.html/js/css   # Extension popup UI
└── icons/              # 16px, 32px, 48px, 128px icons
```

<br/>

## <img src="https://api.iconify.design/ph:hammer-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Building For Production

```bash
pnpm build
```

Type-checks every package, then builds the Vite frontend bundle to `apps/web/dist/` — deployable to any static host (Vercel, Netlify, Cloudflare Pages). The API server runs on any Node.js host (Railway, Render, Fly.io).

<br/>

## <img src="https://api.iconify.design/ph:users-three-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> Contributing

Pull requests are welcome, especially around:
- **Dataset coverage** — more states, utilities, and USGS data points
- **Translation accuracy** — EN/ES and future languages
- **Accessibility** — WCAG 2.1 AA compliance
- **Testing** — unit and integration tests for the scoring model

```bash
git checkout -b feature/your-idea
git commit -m "add: your idea"
git push origin feature/your-idea
```

<br/>

## <img src="https://api.iconify.design/ph:scroll-fill.svg?color=%23C1442D" width="24" height="24" valign="middle"/> License

MIT — free for everyone, forever.

<br/>

<div align="center">

### Built so every family can check their tap.

*9 million US households. One search box. Zero dollars.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:C1442D,100:8B3A2A&height=100&section=footer" width="100%" />

</div>
