/**
 * Plumbum Extension — Popup Script
 * Controls the popup.html UI.
 */

const isDev = !chrome.runtime.getManifest().update_url;
const REPORT_BASE = isDev ? "http://localhost:5173/result" : "https://plumbum.io/result";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchRisk(address) {
  const urls = [];
  if (isDev) {
    urls.push(`http://localhost:8080/api/v1/risk?address=${encodeURIComponent(address)}`);
    urls.push(`http://127.0.0.1:8080/api/v1/risk?address=${encodeURIComponent(address)}`);
  }
  urls.push(`https://plumbum.io/api/v1/risk?address=${encodeURIComponent(address)}`);

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
  if (score >= 80) return "#7A1F0F";
  if (score >= 60) return "#A63D2F";
  if (score >= 40) return "#C07A2A";
  return "#4A7C59";
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
  const color = getScoreColor(score);

  document.getElementById("addressLabel").textContent = data.geocoded_address || data.address || "Address analyzed";
  
  const scoreNumEl = document.getElementById("scoreNum");
  scoreNumEl.textContent = score;
  scoreNumEl.style.color = color;

  const scoreLevelEl = document.getElementById("scoreLevel");
  scoreLevelEl.textContent = (data.risk_level || "").toUpperCase();
  scoreLevelEl.style.color = color;

  // Pregnancy banner
  if (pregnancyMode) {
    show("pregnancyBanner");
  } else {
    hide("pregnancyBanner");
  }

  // Factors
  const factorsList = document.getElementById("factorsList");
  factorsList.innerHTML = "";
  (data.factors || []).forEach((f) => {
    const row = document.createElement("div");
    row.className = "factor-row";
    const pct = (f.score / f.max) * 100;
    row.innerHTML = `
      <span class="factor-name">${f.name}</span>
      <span class="factor-score" style="color:${getScoreColor(pct)}">${f.score}/${f.max}</span>
    `;
    factorsList.appendChild(row);
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
      ${(data.factors || []).map(f => `
        <div class="factor-row">
          <span class="factor-name">${f.name}</span>
          <span class="factor-score" style="color:${getScoreColor((f.score/f.max)*100)}">${f.score}/${f.max}</span>
        </div>
      `).join("")}
      <a href="${REPORT_BASE}?address=${encodeURIComponent(data.address || data.geocoded_address || "")}" target="_blank" class="report-btn" style="margin-top:12px;">View Full Report →</a>
    </div>
  `;
}

// ── Settings ──────────────────────────────────────────────────────────────────

function loadSettings(callback) {
  chrome.storage.local.get(["pb_badge_enabled", "pb_pregnancy_mode", "pb_lang"], (result) => {
    callback({
      badgeEnabled: result.pb_badge_enabled !== false,
      pregnancyMode: result.pb_pregnancy_mode === true,
      lang: result.pb_lang || "en",
    });
  });
}

function initSettings() {
  const badgeEl = document.getElementById("badgeEnabled");
  const pregEl = document.getElementById("pregnancyMode");
  const langEl = document.getElementById("langSelect");

  loadSettings(({ badgeEnabled, pregnancyMode, lang }) => {
    badgeEl.checked = badgeEnabled;
    pregEl.checked = pregnancyMode;
    langEl.value = lang;
  });

  badgeEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_badge_enabled: badgeEl.checked });
  });
  pregEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_pregnancy_mode: pregEl.checked });
  });
  langEl.addEventListener("change", () => {
    chrome.storage.local.set({ pb_lang: langEl.value });
  });

  document.getElementById("settingsToggle").addEventListener("click", () => {
    const panel = document.getElementById("settingsPanel");
    panel.hidden = !panel.hidden;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  initSettings();

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
          searchResult.innerHTML = `<div style="padding:12px;color:#A63D2F;font-size:12px;">Could not find risk data. Try a more specific address.</div>`;
        }
      }

      searchBtn.addEventListener("click", doSearch);
      searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
    }
  });
}

main();
