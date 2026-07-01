/**
 * Plumbum Browser Extension — Content Script v2
 *
 * Supported sites: Zillow, Redfin, Trulia, Realtor.com, Apartments.com
 *
 * Strategy:
 *   1. Parse the listing address from the DOM (site-specific selectors).
 *   2. Fetch the Plumbum risk score from /api/v1/risk?address=...
 *   3. PRIMARY: Inject a brutalist inline block directly below the price element.
 *   4. FALLBACK: If no price anchor found, show a fixed floating badge instead.
 *   5. Re-run on SPA URL changes via MutationObserver.
 */

"use strict";

// ── Configuration ─────────────────────────────────────────────────────────────

const isDev          = !chrome.runtime.getManifest().update_url;
const REPORT_BASE    = isDev ? "http://localhost:5173/result" : "https://plumbummap.org/result";
const CACHE_TTL_MS   = 24 * 60 * 60 * 1000; // 24 h
const BLOCK_ID       = "plumbum-inline-block";
const BADGE_ID       = "plumbum-risk-badge";
const POPOVER_ID     = "plumbum-risk-popover";
const STYLE_ID       = "plumbum-styles";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return "#7A1F0F"; // Very High
  if (score >= 60) return "#A63D2F"; // High
  if (score >= 40) return "#C07A2A"; // Moderate
  return "#4A7C59"; // Low
}

function riskLabel(level) {
  const map = { "Very High": "VERY HIGH", High: "HIGH", Moderate: "MODERATE", Low: "LOW" };
  return map[level] || (level || "").toUpperCase();
}

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

function injectGlobalStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    #${BLOCK_ID} {
      all: initial;
      display: block;
      box-sizing: border-box;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 16px 0;
    }
    #${BLOCK_ID} * { box-sizing: border-box; all: unset; display: revert; }

    #${BADGE_ID} { font-family: Inter, -apple-system, sans-serif; }

    @keyframes pb-pulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(166,61,47,0.15); }
      50%       { box-shadow: 0 0 0 5px rgba(166,61,47,0.35); }
    }
  `;
  document.head.appendChild(s);
}

// ── Address extraction ────────────────────────────────────────────────────────

function extractAddress() {
  const host = location.hostname;

  // ── Zillow ──
  if (host.includes("zillow.com")) {
    const selectors = [
      '[data-testid="bdp-building-address"]',
      'h1[class*="Text"]',
      '[class*="hdp__sc"] h1',
      '.summary-container h1',
      '[data-testid="home-details-chip-container"] h1',
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el?.textContent?.trim().length > 5) return el.textContent.trim();
    }
    const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
    const m = og.match(/^(.+?)\s*\|/);
    if (m) return m[1].trim();
  }

  // ── Redfin ──
  if (host.includes("redfin.com")) {
    const selectors = [
      '[data-rf-test-id="abp-streetLine"]',
      ".street-address",
      'h1[class*="homeAddress"]',
      ".homeAddress",
      '[class*="street-info"] [class*="street-address"]',
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el?.textContent?.trim().length > 5) {
        const cityEl = document.querySelector('[data-rf-test-id="abp-cityStateZip"]') ||
                       document.querySelector(".citystatezip");
        return el.textContent.trim() + (cityEl ? ", " + cityEl.textContent.trim() : "");
      }
    }
  }

  // ── Trulia ──
  if (host.includes("trulia.com")) {
    const selectors = [
      '[data-testid="home-details-summary-city-state"]',
      '[data-testid="pdp-listing-address"]',
      'h1[class*="Address"]',
      ".propertyAddress",
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el?.textContent?.trim().length > 5) return el.textContent.trim();
    }
  }

  // ── Realtor.com ──
  if (host.includes("realtor.com")) {
    const selectors = [
      '[data-testid="address_line1"]',
      '[data-testid="prop-address"]',
      'h1[class*="address"]',
      ".property-address",
      '[class*="Address"] h1',
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el?.textContent?.trim().length > 5) {
        const line2 = document.querySelector('[data-testid="address_line2"]');
        return el.textContent.trim() + (line2 ? ", " + line2.textContent.trim() : "");
      }
    }
  }

  // ── Apartments.com ──
  if (host.includes("apartments.com")) {
    const selectors = [
      ".property-title", ".propertyAddress",
      '[class*="PropertyTitle"]', 'h1[class*="title"]', ".address h1",
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el?.textContent?.trim().length > 5) return el.textContent.trim();
    }
  }

  // Generic og:title fallback
  const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
  const m = og.match(/^(.+?)\s*[-|]/);
  if (m && /\d/.test(m[1])) return m[1].trim();

  return null;
}

// ── Price anchor (injection point) ───────────────────────────────────────────
// Returns the DOM element just ABOVE which we want to insert (we insert AFTER it).

function findPriceAnchor() {
  const host = location.hostname;

  // Zillow
  if (host.includes("zillow.com")) {
    const candidates = [
      '[data-testid="price"]',
      'span[class*="Price"]',
      '[class*="hdp-price"]',
      'h2[class*="Price"]',
      '[data-cy="listing-price"]',
    ];
    for (const s of candidates) {
      const el = document.querySelector(s);
      if (el) return el.closest("[class]") || el;
    }
  }

  // Redfin
  if (host.includes("redfin.com")) {
    const candidates = [
      ".statsValue",
      ".price",
      '[class*="price"]',
      ".homeStats .value",
      '[data-rf-test-id="abp-price"]',
    ];
    for (const s of candidates) {
      const el = document.querySelector(s);
      if (el?.textContent?.includes("$")) return el.closest("[class]") || el;
    }
  }

  // Trulia
  if (host.includes("trulia.com")) {
    const candidates = [
      '[data-testid="pdp-price-card"]',
      '[class*="Price"]',
      ".priceInfo",
    ];
    for (const s of candidates) {
      const el = document.querySelector(s);
      if (el) return el;
    }
  }

  // Realtor.com
  if (host.includes("realtor.com")) {
    const candidates = [
      '[data-testid="list-price"]',
      '[class*="price"]',
      ".listing-price",
      '[class*="Price"]',
    ];
    for (const s of candidates) {
      const el = document.querySelector(s);
      if (el) return el.closest("[class]") || el;
    }
  }

  // Apartments.com
  if (host.includes("apartments.com")) {
    const candidates = [
      ".rentRangeRow", ".rentLabel", '[class*="price-range"]',
    ];
    for (const s of candidates) {
      const el = document.querySelector(s);
      if (el) return el;
    }
  }

  return null;
}

// ── Build inline block (Teaser format, sorted worst-first, brand red CTA) ─────

function buildInlineBlock(data, settings) {
  const score = Math.round(data.score);

  // Sort factors worst-first
  const sortedFactors = [...(data.factors || [])].sort((a, b) => {
    const pctA = a.max > 0 ? (a.score / a.max) : 0;
    const pctB = b.max > 0 ? (b.score / b.max) : 0;
    return pctB - pctA;
  });

  const worstFactor = sortedFactors[0];
  const worstPct = worstFactor ? (worstFactor.score / worstFactor.max) * 100 : 0;

  // Tie overall severity color to the worse of the overall score or worst factor
  const color = scoreColor(Math.max(score, worstPct));
  
  // Format compound label (e.g. MODERATE OVERALL · HIGH DRIVER)
  const overallRisk = riskLabel(data.risk_level || "");
  let levelText = `${overallRisk} RISK`;
  if (worstPct > score && scoreColor(worstPct) !== scoreColor(score)) {
    const worstRiskLevel = worstPct >= 80 ? "VERY HIGH" : (worstPct >= 60 ? "HIGH" : "MODERATE");
    levelText = `${overallRisk} OVERALL · ${worstRiskLevel} DRIVER`;
  }

  const address = data.geocoded_address || data.address || "";
  const reportUrl = `${REPORT_BASE}?address=${encodeURIComponent(data.address || address)}`;

  // Display only the primary risk driver (worst factor) to make it a compact teaser
  const worstFactorHtml = worstFactor ? `
    <div style="margin: 10px 0; padding: 10px; background: #fff; border: 1px solid #E0DDD6; border-left: 3px solid ${scoreColor(worstPct)}; border-radius: 4px;">
      <div style="font-size: 10px; font-weight: 700; color: #888880; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
        ⚠️ Primary Risk Driver
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 600; color: #1A1614;">${worstFactor.name}</span>
        <span style="font-size: 12px; font-weight: 700; color: ${scoreColor(worstPct)};">${worstFactor.score}/${worstFactor.max}</span>
      </div>
    </div>
  ` : "";

  const extraFactorsCount = Math.max(0, sortedFactors.length - 1);
  const teaserText = extraFactorsCount > 0 
    ? `<a href="${reportUrl}" target="_blank" style="font-size: 11px; color: #888880; font-weight: 600; text-decoration: underline; cursor: pointer;">
         + ${extraFactorsCount} more risk factors. View details →
       </a>`
    : "";

  const pregnancyWarning = settings.pregnancyMode ? `
    <div style="background:#5C1A1A;color:#FFFFFF;padding:8px 12px;font-size:11px;
                line-height:1.5;margin-bottom:12px;border-left:3px solid #A63D2F;border-radius:3px;">
      ⚠ PREGNANCY ALERT — No safe level of lead. Take action.
    </div>` : "";

  const block = document.createElement("div");
  block.id = BLOCK_ID;

  block.innerHTML = `
    <div style="
      background: #F8F6F1;
      border: 1px solid #D6CFC8;
      border-left: 4px solid ${color};
      border-radius: 6px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      font-family: Inter, -apple-system, sans-serif;
      margin: 16px 0;
      position: relative;
    ">
      <!-- Water drop corner badge for authority -->
      <div style="position: absolute; top: 12px; right: 16px; font-size: 20px; cursor: pointer;" title="Plumbum Lead Risk Engine" onclick="window.open('${reportUrl}', '_blank')">💧</div>
      
      <!-- Top meta info -->
      <div style="margin-bottom: 8px;">
        <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #888880; margin-bottom: 2px;">
          Lead Pipe Risk · Plumbum
        </div>
        <div style="font-size: 11px; color: #5A5550; line-height: 1.3; max-width: 250px; font-weight: 500;">
          ${address}
        </div>
      </div>

      <!-- Main Score Section -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 12px;">
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <span style="font-family: Georgia, serif; font-size: 38px; font-weight: 700; color: ${color}; letter-spacing: -1px; line-height: 1;">
            ${score}
          </span>
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${color};">
            ${levelText}
          </span>
          <span style="font-size: 10px; color: #A09890;">/ 100</span>
        </div>
      </div>

      ${pregnancyWarning}
      ${worstFactorHtml}
      
      <!-- Footer / Actions -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; gap: 8px; flex-wrap: wrap;">
        ${teaserText}
        <a href="${reportUrl}" target="_blank" rel="noreferrer"
           style="display: inline-block; padding: 8px 14px; background: #A63D2F;
                  color: #FFFFFF; font-size: 11px; font-weight: 700; text-decoration: none;
                  text-transform: uppercase; letter-spacing: 0.05em; border-radius: 4px;
                  font-family: Inter, -apple-system, sans-serif; cursor: pointer;
                  transition: background 0.15s; line-height: 1;"
           onmouseover="this.style.background='#8B2A1C'"
           onmouseout="this.style.background='#A63D2F'">
          View Full Report →
        </a>
      </div>
    </div>
  `;

  return block;
}

// ── Build floating badge (fallback) ──────────────────────────────────────────

function buildFloatingBadge(data, settings) {
  const score = Math.round(data.score);
  const color = scoreColor(score);
  const level = riskLabel(data.risk_level || "");
  const reportUrl = `${REPORT_BASE}?address=${encodeURIComponent(data.address || "")}`;
  const isHigh = score >= 60;

  const badge = document.createElement("div");
  badge.id = BADGE_ID;

  badge.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;height:100%;padding:0 12px;">
      <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#A63D2F;">Pb</div>
      <div style="width:1px;height:28px;background:#E0DDD6;flex-shrink:0;"></div>
      <div>
        <div style="font-size:16px;font-weight:700;color:${color};line-height:1;">${score}</div>
        <div style="font-size:8px;color:#888;text-transform:uppercase;
                    letter-spacing:0.08em;margin-top:1px;">${level}</div>
      </div>
    </div>
  `;

  Object.assign(badge.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "120px",
    height: "52px",
    background: "#F8F6F1",
    border: `1px solid ${isHigh ? color : "#D6CFC8"}`,
    borderRadius: "0",
    zIndex: "2147483647",
    cursor: "pointer",
    fontFamily: "Inter, -apple-system, sans-serif",
    animation: isHigh ? "pb-pulse 2s ease-in-out infinite" : "none",
  });

  // Click → open full report
  badge.addEventListener("click", () => window.open(reportUrl, "_blank"));

  return badge;
}

// ── Chrome storage helpers ────────────────────────────────────────────────────

async function getCached(address) {
  return new Promise(resolve => {
    const key = "pb_cache_" + btoa(unescape(encodeURIComponent(address))).replace(/=/g, "");
    chrome.storage.local.get([key], result => {
      const entry = result[key];
      resolve(entry && Date.now() < entry.expiresAt ? entry.data : null);
    });
  });
}

async function setCached(address, data) {
  return new Promise(resolve => {
    const key = "pb_cache_" + btoa(unescape(encodeURIComponent(address))).replace(/=/g, "");
    chrome.storage.local.set({ [key]: { data, expiresAt: Date.now() + CACHE_TTL_MS } }, resolve);
  });
}

async function getSettings() {
  return new Promise(resolve => {
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
    ], result => {
      resolve({
        enabled: result.pb_badge_enabled !== false,
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
  });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

function removeAll() {
  document.getElementById(BLOCK_ID)?.remove();
  document.getElementById(BADGE_ID)?.remove();
  document.getElementById(POPOVER_ID)?.remove();
}

// ── Main orchestration ────────────────────────────────────────────────────────

async function run() {
  // Always clean up existing UI first
  removeAll();

  const settings = await getSettings();
  if (!settings.enabled) return;

  const host = location.hostname;
  if (host.includes("zillow.com") && !settings.siteZillow) return;
  if (host.includes("redfin.com") && !settings.siteRedfin) return;
  if (host.includes("trulia.com") && !settings.siteTrulia) return;
  if (host.includes("realtor.com") && !settings.siteRealtor) return;

  // Allow SPA to settle and hydrate the DOM
  await new Promise(r => setTimeout(r, 1800));

  const address = extractAddress();
  if (!address) return;

  // Persist for popup access
  chrome.storage.local.set({ pb_current_address: address });

  // Fetch with cache
  let data = await getCached(address);
  if (!data) {
    try {
      data = await fetchRisk(address);
      if (data && typeof data.score === "number") await setCached(address, data);
    } catch {
      return;
    }
  }

  if (!data || typeof data.score !== "number") return;

  // Check threshold
  if (data.score < settings.scoreThreshold) return;

  injectGlobalStyles();

  // Injected detailed card below price
  if (settings.cardAutoInject) {
    const priceAnchor = findPriceAnchor();
    if (priceAnchor) {
      const block = buildInlineBlock(data, settings);
      priceAnchor.insertAdjacentElement("afterend", block);
      return;
    }
  }

  // Fallback: floating badge
  const badge = buildFloatingBadge(data, settings);
  document.body.appendChild(badge);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

run();

// SPA URL-change observer
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    removeAll();
    chrome.storage.local.remove("pb_current_address");
    run();
  }
}).observe(document.documentElement, { subtree: true, childList: true });

// Listen for settings modifications from the popup settings panel to update the UI instantly
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    run();
  }
});
