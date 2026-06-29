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
const REPORT_BASE    = isDev ? "http://localhost:5173/result" : "https://plumbum.io/result";
const CACHE_TTL_MS   = 24 * 60 * 60 * 1000; // 24 h
const BLOCK_ID       = "plumbum-inline-block";
const BADGE_ID       = "plumbum-risk-badge";
const POPOVER_ID     = "plumbum-risk-popover";
const STYLE_ID       = "plumbum-styles";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return "#7A1F0F";
  if (score >= 60) return "#A63D2F";
  if (score >= 40) return "#C07A2A";
  return "#4A7C59";
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

// ── Build inline block ────────────────────────────────────────────────────────

function buildInlineBlock(data, settings) {
  const score = Math.round(data.score);
  const color = scoreColor(score);
  const level = riskLabel(data.risk_level || "");
  const address = data.geocoded_address || data.address || "";
  const reportUrl = `${REPORT_BASE}?address=${encodeURIComponent(data.address || address)}`;
  const isHigh = score >= 60;

  const factorsHtml = (data.factors || []).slice(0, 3).map(f => {
    const pct = Math.round((f.score / f.max) * 100);
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:6px 0;border-bottom:1px solid #E8E0D8;gap:8px;">
        <span style="font-size:11px;color:#5A5550;flex:1;">${f.name}</span>
        <span style="font-size:11px;font-weight:700;color:${scoreColor(pct)};
                     white-space:nowrap;">${f.score}/${f.max}</span>
      </div>`;
  }).join("");

  const pregnancyWarning = settings.pregnancyMode ? `
    <div style="background:#5C1A1A;color:#FFFFFF;padding:8px 12px;font-size:11px;
                line-height:1.5;margin-bottom:12px;border-left:3px solid #A63D2F;">
      ⚠ PREGNANCY ALERT — No safe level of lead during pregnancy. Take immediate action.
    </div>` : "";

  const block = document.createElement("div");
  block.id = BLOCK_ID;

  // Outer wrapper — strict brutalist Plumbum design
  block.innerHTML = `
    <div style="
      background:#F8F6F1;
      border:1px solid #1A1614;
      border-left:3px solid ${color};
      padding:16px 20px;
      font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    ">
      <!-- Header row -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;
                  margin-bottom:12px;gap:12px;">
        <div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;
                      letter-spacing:0.12em;color:#888880;margin-bottom:4px;">
            Lead Pipe Risk · Plumbum
          </div>
          <div style="font-size:11px;color:#5A5550;line-height:1.4;max-width:280px;">
            ${address}
          </div>
        </div>
        <!-- Score badge -->
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-family:Georgia,serif;font-size:42px;font-weight:700;
                      line-height:1;color:${color};letter-spacing:-2px;">
            ${score}
          </div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;
                      letter-spacing:0.1em;color:${color};margin-top:2px;">
            ${level} RISK
          </div>
          <div style="font-size:9px;color:#A09890;margin-top:2px;">/ 100</div>
        </div>
      </div>

      ${pregnancyWarning}

      <!-- Risk factors -->
      ${factorsHtml ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;
                      letter-spacing:0.12em;color:#A09890;margin-bottom:6px;">
            Risk Factors
          </div>
          ${factorsHtml}
        </div>` : ""}

      <!-- CTA row -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-top:12px;gap:8px;flex-wrap:wrap;">
        <a href="${reportUrl}" target="_blank" rel="noreferrer"
           style="display:inline-block;padding:8px 16px;background:${isHigh ? color : "#1A1614"};
                  color:#FFFFFF;font-size:11px;font-weight:700;text-decoration:none;
                  text-transform:uppercase;letter-spacing:0.08em;
                  font-family:Inter,-apple-system,sans-serif;cursor:pointer;
                  border:none;line-height:1;">
          View Full Report →
        </a>
        <div style="font-size:10px;color:#A09890;">
          EPA &amp; Census data · <a href="https://plumbum.io" target="_blank"
          style="color:#A09890;text-decoration:underline;">plumbum.io</a>
        </div>
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
    chrome.storage.local.get(["pb_badge_enabled", "pb_pregnancy_mode", "pb_lang"], result => {
      resolve({
        enabled: result.pb_badge_enabled !== false,
        pregnancyMode: result.pb_pregnancy_mode === true,
        lang: result.pb_lang || "en",
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
  const settings = await getSettings();
  if (!settings.enabled) return;

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

  removeAll();
  injectGlobalStyles();

  // Attempt inline injection below price
  const priceAnchor = findPriceAnchor();

  if (priceAnchor) {
    const block = buildInlineBlock(data, settings);
    // Insert after the price container
    priceAnchor.insertAdjacentElement("afterend", block);
  } else {
    // Fallback: floating badge
    const badge = buildFloatingBadge(data, settings);
    document.body.appendChild(badge);
  }
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
