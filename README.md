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

<a href="#-live-demo">Live Demo</a> •
<a href="#-what-it-does">What It Does</a> •
<a href="#-architecture">Architecture</a> •
<a href="#-tech-stack">Tech Stack</a> •
<a href="#-getting-started">Getting Started</a> •
<a href="#-api">API</a> •
<a href="#-contributing">Contributing</a>

</div>

<br/>

<div align="center">
<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>
</div>

## 💧 What It Does

**Plumbum** tells anyone in the US whether their home's drinking water is at risk from lead pipes — in under 3 seconds, with zero sign-up.

Type an address. Get a personalized risk score, pipe-material heatmap, plain-English translation of your utility's Consumer Confidence Report, and ready-to-send FOIA/landlord/pediatrician letters — all generated instantly from public data.

<table>
<tr>
<td width="50%" valign="top">

### 🔴 The Problem
- Lead service lines poison an estimated **9+ million** US households
- Utility disclosures are buried in dense, jargon-heavy PDF reports
- Renters and buyers have almost no way to check *before* it matters
- Existing tools are paywalled, ad-choked, or don't exist for most cities

</td>
<td width="50%" valign="top">

### ✅ The Fix
- One search box. One number. One clear answer.
- ML risk model trained on EPA / Census / HUD / USGS open data
- Auto-generated advocacy documents — no legalese required
- 100% free, no login, no ads, no tracking — ever

</td>
</tr>
</table>

<br/>

## 📊 Risk Score, Visualized

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor':'#C1442D','primaryTextColor':'#fff','primaryBorderColor':'#8B3A2A',
  'lineColor':'#C1442D','secondaryColor':'#f5e9e5','tertiaryColor':'#fff'}}}%%
pie showData
    title Composite Lead Risk Score — Weighting
    "Pipe Material Era" : 40
    "Home Build Year" : 25
    "Utility Violation History" : 20
    "Neighborhood Redlining Correlation" : 15
```

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor':'#C1442D','primaryTextColor':'#fff','primaryBorderColor':'#8B3A2A',
  'lineColor':'#8B3A2A'}}}%%
xychart-beta
    title "Search Volume Growth (illustrative)"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Addresses Scored" 0 --> 50000
    bar [4200, 8900, 15300, 24800, 36100, 47500]
```

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
    end

    subgraph Data["📦 External Open Data"]
        K[(EPA)]
        L[(Census)]
        M[(HUD)]
        N[(USGS)]
    end

    A -->|address query| G
    H --> K & L & M & N
    B --> I

    style Client fill:#fdf1ee,stroke:#C1442D,stroke-width:2px
    style Ext fill:#fdf1ee,stroke:#C1442D,stroke-width:2px
    style Server fill:#f3d9d2,stroke:#8B3A2A,stroke-width:2px
    style Data fill:#ffffff,stroke:#8B3A2A,stroke-width:1px,stroke-dasharray: 4 4
```

<br/>

## 🧭 Site Map

| Route | Purpose |
|---|---|
| `/` | Hero search, featured cities, state risk map, live accountability preview, API playground |
| `/result` | Full report — score ring, risk factors, heatmap, CCR translation, 6 action tabs, PDF export |
| `/listing-result` | Extension-driven result page for real-estate listing URLs |
| `/schools` | Lead risk for nearby schools & daycares, interactive map |
| `/hotspots` | Live city leaderboard by search volume & average risk |
| `/accountability` | Crowdsourced landlord compliance registry |
| `/city/:slug` | Neighborhood-level deep dive for a specific city |
| `/research` | Journalist tools — budget tracker, redlining correlation, FOIA & press-pitch generators |
| `/methodology` | How the GBM scoring model works |
| `/api-docs` | Live interactive API explorer |
| `/extension` | Browser extension install & dev guide |
| `/data` | Raw open dataset downloads |

<br/>

## ⚡ Key Capabilities

<div align="center">

| 🎯 Feature | Description |
|:---:|---|
| **Live Risk Scoring** | GBM model scores any US address in real time |
| **PDF Reports** | Branded, bilingual `jsPDF` reports, one click to download |
| **Document Generators** | FOIA request, landlord notice, pediatrician letter, free-filter demand |
| **Pregnancy Mode** | Elevated warnings surfaced site-wide when toggled on |
| **Crowdsource DB** | Community-submitted pipe material & water test verification |
| **Browser Extension** | Injects risk badges directly onto Zillow / Redfin listings |
| **EN / ES Bilingual** | Full parity across every page and generated document |

</div>

<br/>

## 🛠️ Tech Stack

<div align="center">

![React](https://skillicons.dev/icons?i=react,ts,vite,supabase,nodejs,pnpm,css,html)

</div>

```
Frontend   → React 18 · TypeScript · Vite · CSS Modules · Leaflet
Backend    → Node · Express-style routes · Supabase (Postgres)
Tooling    → pnpm workspaces · shared tsconfig base
Extension  → Manifest V3 browser extension (Zillow/Redfin injection)
i18n       → Custom EN/ES translation layer (lib/translations)
PDF/Docs   → jsPDF-based letter & report generation
```

<br/>

## 📁 Monorepo Structure

```text
Plumbum/
├── apps/
│   ├── web/            # React + Vite frontend
│   │   └── src/
│   │       ├── pages/       # 13 routed pages
│   │       ├── components/  # UI, maps, letters, demos
│   │       ├── hooks/       # PDF gen, letter gen, translation
│   │       └── lib/         # translations, shared utils
│   └── server/          # API — /api/risk, /api/accountability
├── extension/            # Browser extension source
├── packages/             # Shared workspace packages
├── data/                 # Static server data
└── scripts/              # Build & deploy scripts
```

<br/>

## 🚀 Getting Started

```bash
# clone
git clone https://github.com/YOUR_USERNAME/plumbum.git
cd plumbum

# install (pnpm workspace)
pnpm install

# run frontend + server in dev
pnpm --filter web dev
pnpm --filter server dev
```

> Requires a `.env` with your Supabase project keys — see `supabase_setup.md`.

<br/>

## 🔌 API

```bash
GET /api/risk?address=123+Main+St,+Anytown,+ST
```

```json
{
  "score": 72,
  "riskLevel": "elevated",
  "factors": {
    "pipeEra": "pre-1986",
    "buildYear": 1958,
    "violationHistory": 3,
    "redliningCorrelation": "high"
  }
}
```

Full interactive docs live at **`/api-docs`** once the server is running.

<br/>

## 🤝 Contributing

Pull requests welcome — especially around dataset coverage, translation accuracy, and accessibility.

```bash
git checkout -b feature/your-idea
git commit -m "add: your idea"
git push origin feature/your-idea
```

<br/>

<div align="center">

### 💧 Built so every family can check their tap.

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:C1442D,100:8B3A2A&height=100&section=footer" width="100%" />

</div>
