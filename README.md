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

<a href="#-what-it-does">What It Does</a> •
<a href="#-the-problem-it-solves">The Problem</a> •
<a href="#-how-it-works">How It Works</a> •
<a href="#-architecture">Architecture</a> •
<a href="#-tech-stack">Tech Stack</a> •
<a href="#-getting-started">Getting Started</a> •
<a href="#-environment-variables">Env Setup</a> •
<a href="#-api">API</a> •
<a href="#-browser-extension">Extension</a> •
<a href="#-contributing">Contributing</a>

</div>

<br/>

<div align="center">
<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>
</div>

## 💧 What It Does

**Plumbum** is a free, open-source public health tool that tells anyone in the US whether their home's drinking water is at risk from lead contamination — in under 3 seconds, with zero sign-up required.

You type an address. Plumbum pulls from **EPA enforcement records, US Census housing data, HUD redlining maps, and USGS geological surveys** to compute a personalized lead risk score. You get:

- 📊 A **composite lead risk score** (0–100) with a clear risk tier: Low / Moderate / Elevated / High
- 🗺️ An **interactive pipe-material heatmap** for your neighborhood and nearby schools
- 📄 An **AI-translated Consumer Confidence Report** — your utility's annual water report, in plain English (and Spanish)
- ✉️ **Ready-to-send advocacy documents** — FOIA requests, landlord notices, pediatrician letters, and free-filter demand letters, auto-filled with your address and risk data
- 🏠 A **browser extension** that injects your risk score directly onto Zillow and Redfin property listings while you browse

<br/>

## 🔴 The Problem It Solves

<table>
<tr>
<td width="50%" valign="top">

### The Reality of Lead in US Water
- An estimated **9+ million** US households are still served by lead service lines
- The EPA's Lead and Copper Rule requires utilities to report violations — but buries them in **dense, jargon-heavy PDFs** called Consumer Confidence Reports (CCRs)
- Most people never read their CCR. Most renters never receive one.
- Homebuyers and renters have almost **no practical way to check lead risk before signing a lease or closing a sale**
- Existing tools are either **paywalled**, ad-choked, or simply don't cover most US cities

</td>
<td width="50%" valign="top">

### What Was Missing
- A single, free tool that answers: *"Is my tap water safe from lead?"*
- Something that **works for renters**, not just homeowners
- A resource available in **Spanish** for non-English speaking families
- A way to **hold landlords accountable** when they ignore water quality concerns
- A tool that helps **journalists and researchers** investigate systemic patterns of lead exposure

</td>
</tr>
</table>

### How Plumbum Fixes It

| ❌ Before Plumbum | ✅ With Plumbum |
|---|---|
| CCR buried in a utility PDF, written in legalese | Plain-English (and Spanish) AI summary of your utility's report |
| No way to check risk before renting or buying | Instant risk score for any US address — no sign-up |
| Zillow/Redfin show square footage but not lead risk | Browser extension injects a risk badge on every listing you browse |
| Lead violations require a lawyer or FOIA expert | One-click FOIA request auto-filled with your address and risk data |
| No neighborhood-level data for schools | Interactive map of lead risk at nearby schools and daycares |
| Renters have no leverage with landlords | Generates a formal landlord notice with community compliance tracking |

<br/>

## ⚙️ How It Works

### The Risk Score Engine

Plumbum's scoring model is a **Gradient Boosted Machine (GBM)** trained on multiple public datasets, weighted roughly as follows:

- **Pipe material era** (pre/post the 1986 lead ban) — the single strongest signal
- **Home build year & housing stock age**
- **Utility violation history** (EPA SDWIS)
- **Neighborhood redlining correlation** (HUD)

When you search an address, the server:

1. **Geocodes** the address using Census TIGER/Line data
2. **Fetches Census tract** demographics and housing vintage (build year distribution)
3. **Cross-references EPA SDWIS** for utility violation history and enforcement actions
4. **Pulls HUD HOLC redlining grades** to surface historical infrastructure disinvestment
5. **Queries USGS** for regional geological corrosivity (naturally soft/acidic water accelerates lead leaching)
6. Combines all signals into a **composite 0–100 risk score** in real time

Full methodology and exact weighting live at **`/methodology`**.

### The CCR Translation Pipeline

Your utility publishes an annual **Consumer Confidence Report** (CCR) — a legally-required document that is almost unreadable. Plumbum:
1. Fetches the CCR PDF URL from EPA's public registry
2. Extracts key violation data and lead/copper test results
3. Sends structured data to **Llama 3.3 70B via Groq** for plain-language summarization
4. Returns an EN/ES bilingual summary alongside your risk score

### The Accountability Registry

When a tenant sends a landlord notice through Plumbum, it is stored (anonymously) in a **Supabase-backed crowdsource database**. The community can:
- See which landlords have **refused** to test or remediate
- Track properties with **positive lead test results**
- Submit their own DIY water test results (lead ppb) to enrich the public dataset

<br/>

## 🗺️ Architecture

```mermaid
flowchart LR
    subgraph Client["🌐 apps/web — React + Vite"]
        A[Search Bar] --> B[Result Page]
        B --> C[PDF Report Generator]
        B --> D["Letter Generators<br/>FOIA · Landlord · Pediatrician · Filter"]
        B --> E["Interactive Maps<br/>Leaflet: city / schools / hotspots"]
    end

    subgraph Ext["🧩 extension/ — Browser Extension"]
        F[Zillow / Redfin Badge Injection] --> B
    end

    subgraph Server["⚙️ apps/server — API"]
        G["/api/risk"] --> H[GBM Scoring Model]
        I["/api/accountability"] --> J[(Crowdsourced Registry)]
        K["/api/ccr"] --> L[Groq LLM Translation]
        M["/api/schools"] --> N[Google Places API]
        O["/api/real-estate"] --> P[Listing Risk Lookup]
    end

    subgraph Data["📦 External Open Data"]
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

## 🧭 Site Map

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
| `/api-docs` | Live interactive API explorer (no Postman needed) |
| `/extension` | Browser extension install guide & developer docs |
| `/data` | Open dataset of anonymized, crowdsourced water test results |

<br/>

## ⚡ Key Capabilities

<div align="center">

| 🎯 Feature | Description |
|:---:|---|
| **Live Risk Scoring** | GBM model scores any US address in real time against 4 open data sources |
| **AI CCR Translation** | Llama 3.3 70B summarizes your utility's PDF water report into plain English/Spanish |
| **PDF Reports** | Branded, bilingual `jsPDF` reports, one click to download |
| **Document Generators** | FOIA request, landlord notice, pediatrician letter, free-filter demand |
| **Pregnancy Mode** | Elevated warnings surfaced site-wide when toggled — lower safe thresholds applied |
| **Crowdsource DB** | Community-submitted pipe material & DIY water test verification |
| **Landlord Registry** | Anonymous compliance tracking — refused, pending, tested positive/negative |
| **Browser Extension** | Injects risk badges directly onto Zillow / Redfin listings while you browse |
| **Schools Map** | Nearby schools and daycares scored and pinned on an interactive Leaflet map |
| **Hotspot Leaderboard** | Real-time ranking of cities by search activity and average risk |
| **Representative Lookup** | Finds your local, state, and federal reps to contact about water issues |
| **Alert Subscriptions** | Email alerts when your utility issues a new lead violation (via SendGrid) |
| **EN / ES Bilingual** | Full parity across every page and generated document |

</div>

<br/>

## 🛠️ Tech Stack

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

## 📁 Monorepo Structure

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
├── packages/                 # Shared workspace packages (api-client-react, etc.)
├── data/                     # Static server-side reference data
├── lib/                      # Shared library code across workspace
├── scripts/                  # Build & deploy utilities
├── supabase_setup.md         # Database schema and Supabase configuration guide
└── pnpm-workspace.yaml       # pnpm monorepo workspace config
```

<br/>

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18 | JavaScript runtime |
| [pnpm](https://pnpm.io/) | ≥ 8 | Package manager & workspace orchestration |
| [Supabase account](https://supabase.com/) | — | Postgres database (free tier works) |

Install pnpm if you don't have it:
```bash
npm install -g pnpm
```

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/plumbum.git
cd plumbum
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for **all workspaces** (`apps/web`, `apps/server`, `packages/`) in one command.

### 3. Configure Environment Variables

Create a `.env` file at the **project root** (copy the template below):

```env
# ── Supabase (Required) ─────────────────────────────────────────────────
# Option A: Direct Postgres connection (recommended)
DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Option B: Supabase JS client
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

### 4. Set Up the Database

Open your [Supabase SQL Editor](https://app.supabase.com) and run the schema from [`supabase_setup.md`](./supabase_setup.md). This creates:
- `test_results` — community-submitted DIY water test data (lead ppb per Census tract)
- `landlord_notices` — crowdsourced landlord compliance registry with response tracking

### 5. Run the Development Servers

Open **two terminals** and run each from the project root:

**Terminal 1 — Frontend (React + Vite, port 5173):**
```bash
pnpm dev:web
```

**Terminal 2 — Backend (API Server, port 8080):**
```bash
pnpm dev:server
```

> The frontend proxies API requests to `localhost:8080` automatically via Vite's dev server config. Open **http://localhost:5173** in your browser.

### 6. Install the Browser Extension (Optional)

To use the Zillow/Redfin badge injection in development:

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/` folder from this repo
4. Navigate to any Zillow or Redfin listing — you'll see a Plumbum risk badge appear on each property card

<br/>

## 🔌 API

The server exposes a REST API on port `8080`. Full interactive docs are available at **`/api-docs`** once the server is running.

### `GET /api/risk` — Lead Risk Score

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

### `GET /api/ccr` — Consumer Confidence Report (AI Translation)

```bash
GET /api/ccr?address=123+Main+St,+Chicago,+IL&lang=en
```

Returns a plain-language AI summary of the utility's annual water quality report.

### `GET /api/schools` — Nearby School Lead Risk

```bash
GET /api/schools?lat=41.8827&lng=-87.6233&radius=3000
```

Returns nearby schools and daycares with individual risk scores and map pins.

### `GET /api/hotspots` — City Risk Leaderboard

```bash
GET /api/hotspots
```

Returns cities ranked by search volume and average risk score.

### `POST /api/accountability` — Submit Landlord Notice

```bash
POST /api/accountability
Content-Type: application/json

{
  "propertyAddress": "123 Main St, Chicago, IL",
  "riskScore": 72,
  "landlordName": "John Smith",
  "landlordResponse": "PENDING"
}
```

### `GET /api/real-estate` — Real-Estate Listing Risk (Extension)

```bash
GET /api/real-estate?url=https://www.zillow.com/homedetails/...
```

Used by the browser extension to score a listing URL directly.

### `GET /api/representatives` — Find Your Representatives

```bash
GET /api/representatives?address=123+Main+St,+Chicago,+IL
```

Returns local, state, and federal representatives with contact information.

<br/>

## 🧩 Browser Extension

The Plumbum extension injects a **color-coded lead risk badge** on every property card you browse on Zillow and Redfin.

### What it does
- Detects Zillow and Redfin listing pages automatically
- Extracts the property address from the listing DOM
- Calls `/api/real-estate` to fetch a risk score in the background
- Injects a badge (🟢 Low / 🟡 Moderate / 🟠 Elevated / 🔴 High) directly onto the listing card
- Clicking the badge opens a full Plumbum result report for that address

### Extension structure

```
extension/
├── manifest.json       # Manifest V3 — permissions: zillow.com, redfin.com
├── content.js          # Badge injection logic (runs on listing pages)
├── background.js       # Service worker — handles API calls from content script
├── popup.html/js/css   # Extension popup UI
└── icons/              # 16px, 32px, 48px, 128px icons
```

<br/>

## 🏗️ Building for Production

```bash
# Type-check all packages, then build everything
pnpm build
```

This runs `tsc --build` across the workspace and builds the Vite frontend bundle. The output goes to `apps/web/dist/` — deploy it to any static host (Vercel, Netlify, Cloudflare Pages). The API server can be deployed to any Node.js host (Railway, Render, Fly.io).

<br/>

## 🤝 Contributing

Pull requests are welcome — especially around:
- 📊 **Dataset coverage** — more states, utilities, and USGS data points
- 🌐 **Translation accuracy** — EN/ES and future languages
- ♿ **Accessibility** — WCAG 2.1 AA compliance
- 🧪 **Testing** — unit and integration tests for the scoring model

```bash
# Fork the repo, then:
git checkout -b feature/your-idea
git commit -m "add: your idea"
git push origin feature/your-idea
# Open a pull request on GitHub
```

<br/>

## 📄 License

MIT — free for everyone, forever.

<br/>

<div align="center">

### 💧 Built so every family can check their tap.

*9 million US households. One search box. Zero dollars.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:C1442D,100:8B3A2A&height=100&section=footer" width="100%" />

</div>
