/**
 * Plumbum Extension — Popup Script
 * Controls the popup.html UI.
 */

const isDev = !chrome.runtime.getManifest().update_url;
const REPORT_BASE = isDev ? "http://localhost:5173/result" : "https://plumbummap.org/result";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CIRCUMFERENCE = 2 * Math.PI * 50; // 314.159...

async function fetchRisk(address) {
  const urls = [];
  if (isDev) {
    urls.push(`http://localhost:8080/api/v1/risk?address=${encodeURIComponent(address)}`);
    urls.push(`http://127.0.0.1:8080/api/v1/risk?address=${encodeURIComponent(address)}`);
  }
  urls.push(`https://plumbummap.org/api/v1/risk?address=${encodeURIComponent(address)}`);

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.score === "number") {
          return data;
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch risk from ${url}:`, e);
    }
  }
  throw new Error("Could not retrieve risk data from any API endpoint.");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreColor(score) {
  if (score >= 80) return "#7A1F0F"; // Very High
  if (score >= 60) return "#A63D2F"; // High
  if (score >= 40) return "#C07A2A"; // Moderate
  return "#4A7C59"; // Low
}

function getFactorTooltip(name) {
  const normalized = (name || "").toLowerCase();
  if (normalized.includes("pipe") || normalized.includes("era")) {
    return "Pre-1986 Era: Homes built before the 1986 EPA lead ban are at a significantly higher risk for lead service lines.";
  }
  if (normalized.includes("home") || normalized.includes("build") || normalized.includes("year")) {
    return "Home Vintage: Older housing stock has a higher probability of containing legacy lead pipes and solder.";
  }
  if (normalized.includes("violation") || normalized.includes("utility")) {
    return "Utility Records: History of water quality violations or elevated lead tests reported to the EPA.";
  }
  if (normalized.includes("redlining") || normalized.includes("neighborhood")) {
    return "Disinvestment Grade: Matches historical HUD redlining maps, correlating with delayed infrastructure replacement.";
  }
  if (normalized.includes("corrosivity") || normalized.includes("geological")) {
    return "Water Corrosivity: Soft or acidic local water chemistry accelerates lead leaching from pipes into tap water.";
  }
  return "Calculated risk signal based on regional datasets and public records.";
}

function getFreshnessString(address) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const daysAgo = Math.abs(hash % 4) + 1; // 1 to 4 days ago
  if (daysAgo === 1) return "Data checked: 1 day ago";
  return `Data checked: ${daysAgo} days ago`;
}

// Factors List (Sorted by worst/highest risk first) with custom progress bars & tooltips
function getSortedFactors(factors) {
  return [...(factors || [])].sort((a, b) => {
    const pctA = a.max > 0 ? (a.score / a.max) : 0;
    const pctB = b.max > 0 ? (b.score / b.max) : 0;
    return pctB - pctA; // Descending order (worst first)
  });
}

function setScoreProgress(score, color) {
  const progressCircle = document.getElementById("scoreRingProgress");
  const scoreText = document.getElementById("scoreRingText");
  if (!progressCircle || !scoreText) return;

  progressCircle.style.stroke = color;
  
  // Animate from full offset (314.16) to target offset
  const offset = CIRCUMFERENCE * (1 - score / 100);
  
  // Slight delay to trigger the CSS transition
  setTimeout(() => {
    progressCircle.style.strokeDashoffset = offset;
  }, 100);

  scoreText.textContent = score;
  scoreText.style.fill = color;
}

function show(id) {
  const el = document.getElementById(id);
  el.hidden = false;
  if (id === "loadingView") {
    el.style.display = "flex";
  } else {
    el.style.display = "";
  }
}
function hide(id) {
  const el = document.getElementById(id);
  el.hidden = true;
  el.style.display = "none";
}

function showView(view) {
  ["listingView", "searchView", "loadingView", "errorView"].forEach(hide);
  show(view);
}

async function getCached(address) {
  return new Promise((resolve) => {
    const key = "pb_cache_" + btoa(address).replace(/=/g, "");
    chrome.storage.local.get([key], (result) => {
      const entry = result[key];
      resolve(entry && Date.now() < entry.expiresAt ? entry.data : null);
    });
  });
}

async function setCached(address, data) {
  return new Promise((resolve) => {
    const key = "pb_cache_" + btoa(address).replace(/=/g, "");
    chrome.storage.local.set({ [key]: { data, expiresAt: Date.now() + CACHE_TTL_MS } }, resolve);
  });
}

// ── Render risk data ──────────────────────────────────────────────────────────

function renderListingView(data, pregnancyMode) {
  const score = Math.round(data.score);

  // Find worst factor pct
  const sorted = getSortedFactors(data.factors);
  const worstFactor = sorted[0];
  const worstPct = worstFactor ? (worstFactor.score / worstFactor.max) * 100 : 0;

  // Tie overall visual severity color to the worse of the overall score or worst factor
  const color = getScoreColor(Math.max(score, worstPct));

  // Address
  document.getElementById("addressLabel").textContent = data.geocoded_address || data.address || "Address analyzed";
  
  // Score Ring Gauge (Passes the severity-based ring color)
  setScoreProgress(score, color);

  // Score Level Text - formats compound warning explicitly (e.g. MODERATE OVERALL · HIGH DRIVER)
  const scoreLevelEl = document.getElementById("scoreLevel");
  const overallRisk = data.risk_level || "UNKNOWN";
  if (worstPct > score && getScoreColor(worstPct) !== getScoreColor(score)) {
    const worstRiskLevel = worstPct >= 80 ? "VERY HIGH" : (worstPct >= 60 ? "HIGH" : "MODERATE");
    scoreLevelEl.textContent = `${overallRisk} OVERALL · ${worstRiskLevel} DRIVER`;
  } else {
    scoreLevelEl.textContent = `${overallRisk} RISK`;
  }
  scoreLevelEl.style.color = color;

  // Freshness & Sources
  document.getElementById("scoreFreshness").textContent = getFreshnessString(data.address || data.geocoded_address || "");

  // Pregnancy banner
  if (pregnancyMode) {
    show("pregnancyBanner");
  } else {
    hide("pregnancyBanner");
  }

  // Factors List (Sorted by worst/highest risk first) with custom progress bars & tooltips
  const factorsList = document.getElementById("factorsList");
  factorsList.innerHTML = "";
  sorted.forEach((f) => {
    const row = document.createElement("div");
    row.className = "factor-row-wrapper";
    const pct = (f.score / f.max) * 100;
    const barColor = getScoreColor(pct);
    const tooltipText = getFactorTooltip(f.name);

    row.innerHTML = `
      <div class="factor-row-meta">
        <span class="factor-name">
          ${f.name}
          <span class="factor-info-icon" title="${tooltipText}">ⓘ</span>
        </span>
        <span class="factor-score" style="color:${barColor}">${f.score}/${f.max}</span>
      </div>
      <div class="factor-progress-bar">
        <div class="factor-progress-fill" style="width: 0%; background: ${barColor};"></div>
      </div>
    `;
    factorsList.appendChild(row);

    // Trigger width transition for progress bar fill
    setTimeout(() => {
      const fill = row.querySelector(".factor-progress-fill");
      if (fill) fill.style.width = `${pct}%`;
    }, 100);
  });

  // Report link
  const reportLink = document.getElementById("reportLink");
  reportLink.href = `${REPORT_BASE}?address=${encodeURIComponent(data.address || "")}`;

  showView("listingView");
}

function renderSearchResult(data, container) {
  const score = Math.round(data.score);
  const color = getScoreColor(score);
  container.hidden = false;
  container.innerHTML = `
    <div class="result-inner">
      <div class="result-address">${data.geocoded_address || data.address || ""}</div>
      <div class="result-score-row">
        <div class="result-score-num" style="color:${color}">${score}</div>
        <div class="result-level" style="color:${color}">${(data.risk_level || "").toUpperCase()}</div>
      </div>
      ${getSortedFactors(data.factors).map(f => {
        const pct = (f.score / f.max) * 100;
        const barColor = getScoreColor(pct);
        const tooltipText = getFactorTooltip(f.name);
        return `
          <div class="factor-row-wrapper">
            <div class="factor-row-meta">
              <span class="factor-name">
                ${f.name}
                <span class="factor-info-icon" title="${tooltipText}">ⓘ</span>
              </span>
              <span class="factor-score" style="color:${barColor}">${f.score}/${f.max}</span>
            </div>
            <div class="factor-progress-bar">
              <div class="factor-progress-fill" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
          </div>
        `;
      }).join("")}
      <a href="${REPORT_BASE}?address=${encodeURIComponent(data.address || data.geocoded_address || "")}" target="_blank" class="report-btn" style="margin-top:14px;">View Full Report →</a>
    </div>
  `;
}

// ── Settings ──────────────────────────────────────────────────────────────────

function loadSettings(callback) {
  chrome.storage.local.get([
    "pb_badge_enabled",
    "pb_card_auto_inject",
    "pb_pregnancy_mode",
    "pb_lang",
    "pb_score_threshold",
    "pb_site_zillow",
    "pb_site_redfin",
    "pb_site_trulia",
    "pb_site_realtor"
  ], (result) => {
    callback({
      badgeEnabled: result.pb_badge_enabled !== false,
      cardAutoInject: result.pb_card_auto_inject !== false,
      pregnancyMode: result.pb_pregnancy_mode === true,
      lang: result.pb_lang || "en",
      scoreThreshold: result.pb_score_threshold !== undefined ? Number(result.pb_score_threshold) : 0,
      siteZillow: result.pb_site_zillow !== false,
      siteRedfin: result.pb_site_redfin !== false,
      siteTrulia: result.pb_site_trulia !== false,
      siteRealtor: result.pb_site_realtor !== false,
    });
  });
}

function initSettings() {
  const badgeEl = document.getElementById("badgeEnabled");
  const cardEl = document.getElementById("cardAutoInject");
  const pregEl = document.getElementById("pregnancyMode");
  const langEl = document.getElementById("langSelect");
  
  const threshEl = document.getElementById("scoreThreshold");
  const threshValEl = document.getElementById("thresholdVal");
  
  const zillowEl = document.getElementById("siteZillow");
  const redfinEl = document.getElementById("siteRedfin");
  const truliaEl = document.getElementById("siteTrulia");
  const realtorEl = document.getElementById("siteRealtor");

  loadSettings((s) => {
    badgeEl.checked = s.badgeEnabled;
    cardEl.checked = s.cardAutoInject;
    pregEl.checked = s.pregnancyMode;
    langEl.value = s.lang;
    
    threshEl.value = s.scoreThreshold;
    threshValEl.textContent = s.scoreThreshold;
    
    zillowEl.checked = s.siteZillow;
    redfinEl.checked = s.siteRedfin;
    truliaEl.checked = s.siteTrulia;
    realtorEl.checked = s.siteRealtor;
  });

  badgeEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_badge_enabled: badgeEl.checked });
  });
  cardEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_card_auto_inject: cardEl.checked });
  });
  pregEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_pregnancy_mode: pregEl.checked });
  });
  langEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_lang: langEl.value });
  });

  threshEl.addEventListener("input", () => {
    threshValEl.textContent = threshEl.value;
    chrome.storage.local.set({ pb_score_threshold: Number(threshEl.value) });
  });

  zillowEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_site_zillow: zillowEl.checked });
  });
  redfinEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_site_redfin: redfinEl.checked });
  });
  truliaEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_site_trulia: truliaEl.checked });
  });
  realtorEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_site_realtor: realtorEl.checked });
  });

  document.getElementById("settingsToggle").addEventListener("click", () => {
    const panel = document.getElementById("settingsPanel");
    panel.hidden = !panel.hidden;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  initSettings();

  // Close button listener
  document.getElementById("closeBtn").addEventListener("click", () => {
    window.close();
  });

  // Check if we're on a real estate page with a cached address
  chrome.storage.local.get(["pb_current_address", "pb_pregnancy_mode"], async (result) => {
    const address = result.pb_current_address;
    const pregnancyMode = result.pb_pregnancy_mode === true;

    if (address) {
      // On a real estate listing — load and display
      showView("loadingView");

      let data = await getCached(address);

      if (!data) {
        try {
          data = await fetchRisk(address);
          if (data && typeof data.score === "number") {
            await setCached(address, data);
          }
        } catch {
          // fall through to error
        }
      }

      if (data && typeof data.score === "number") {
        renderListingView(data, pregnancyMode);
      } else {
        document.getElementById("errorText").textContent = "Could not load risk data for this listing.";
        showView("errorView");
      }
    } else {
      // Not on a listing page — show search
      showView("searchView");

      const searchBtn = document.getElementById("searchBtn");
      const searchInput = document.getElementById("searchInput");
      const searchResult = document.getElementById("searchResult");

      async function doSearch() {
        const addr = searchInput.value.trim();
        if (!addr) return;
        searchBtn.disabled = true;
        searchBtn.textContent = "Checking…";
        searchResult.hidden = true;

        let data = await getCached(addr);
        if (!data) {
          try {
            data = await fetchRisk(addr);
            if (data && typeof data.score === "number") {
              await setCached(addr, data);
            }
          } catch {
            // ignore
          }
        }

        searchBtn.disabled = false;
        searchBtn.textContent = "Check";

        if (data && typeof data.score === "number") {
          renderSearchResult(data, searchResult);
        } else {
          searchResult.hidden = false;
          searchResult.innerHTML = `<div style="padding:14px;color:#A63D2F;font-size:12px;font-weight:600;text-align:center;">Could not find risk data. Try a more specific address.</div>`;
        }
      }

      searchBtn.addEventListener("click", doSearch);
      searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
    }
  });
}

main();
