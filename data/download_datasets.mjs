#!/usr/bin/env node
/**
 * Plumbum Dataset Downloader
 * --------------------------
 * Downloads real government datasets used by the scoring engine.
 *
 * Run once before starting the server:
 *   node data/download_datasets.mjs
 *
 * Downloads:
 *   1. EPA SDWIS violations (PB90/CU90 — lead and copper action level exceedances)
 *      → data/epa_violations.json
 *
 * Census ACS data is fetched per-tract on demand (no bulk download needed).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = __dirname;

// ── Colours for terminal output ────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function log(msg) { console.log(msg); }
function ok(msg) { console.log(`${c.green}✓${c.reset} ${msg}`); }
function warn(msg) { console.warn(`${c.yellow}⚠${c.reset} ${msg}`); }
function err(msg) { console.error(`${c.red}✗${c.reset} ${msg}`); }
function info(msg) { console.log(`${c.cyan}→${c.reset} ${msg}`); }

// ── EPA SDWIS ──────────────────────────────────────────────────────────────────

const EPA_OUTPUT = path.join(DATA_DIR, "epa_violations.json");

// Contaminant codes to keep
const LEAD_COPPER = new Set(["PB90", "CU90", "PB", "CU", "5000", "2040", "2041", "1030"]);

// We fetch in batches because the API has a row limit per request
const EPA_BATCH_SIZE = 10000;
const EPA_MAX_ROWS = 200000;

async function fetchEpaBatch(start, size) {
  const url = `https://data.epa.gov/efservice/VIOLATION/ROWS/${start}:${start + size - 1}/JSON`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Plumbum/1.0 dataset-downloader" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`EPA API returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function downloadEpaViolations() {
  log(`\n${c.bold}Step 1: EPA SDWIS Violations${c.reset}`);
  info("Fetching lead/copper action level exceedances from EPA EFSERVICE...");
  info("This may take 1–3 minutes depending on your connection.\n");

  const allViolations = [];
  let start = 0;
  let batch = 0;
  let done = false;

  while (!done && start < EPA_MAX_ROWS) {
    batch++;
    process.stdout.write(`  Fetching batch ${batch} (rows ${start}–${start + EPA_BATCH_SIZE - 1})... `);

    try {
      const rows = await fetchEpaBatch(start, EPA_BATCH_SIZE);

      if (rows.length === 0) {
        console.log(`${c.gray}done (no more rows)${c.reset}`);
        done = true;
        break;
      }

      // Filter to lead/copper only
      const filtered = rows.filter(r => {
        const code = (r.CONTAMINANT_CODE || r.contaminant_code || "").trim().toUpperCase();
        return LEAD_COPPER.has(code);
      });

      allViolations.push(...filtered);
      console.log(`${c.green}${rows.length} rows, ${filtered.length} lead/copper kept${c.reset}`);

      if (rows.length < EPA_BATCH_SIZE) {
        done = true;
      } else {
        start += EPA_BATCH_SIZE;
        // Polite delay to avoid hammering the API
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      console.log(`${c.red}FAILED${c.reset}`);
      warn(`Batch ${batch} failed: ${e.message}`);
      warn("Continuing with what was downloaded so far...");
      done = true;
    }
  }

  if (allViolations.length === 0) {
    warn("No lead/copper violations were downloaded. The scoring engine will use fallback values.");
    warn("This is OK — the server will still work, but Factor 2 will always use the minimum score.");
    // Write empty array so the file exists
    fs.writeFileSync(EPA_OUTPUT, JSON.stringify([], null, 0), "utf-8");
    warn(`Wrote empty file to ${EPA_OUTPUT}`);
    return;
  }

  fs.writeFileSync(EPA_OUTPUT, JSON.stringify(allViolations, null, 0), "utf-8");
  const fileSizeKB = Math.round(fs.statSync(EPA_OUTPUT).size / 1024);
  ok(`Saved ${allViolations.length} lead/copper violations → ${EPA_OUTPUT} (${fileSizeKB} KB)`);
}

// ── Census API key reminder ────────────────────────────────────────────────────

function printCensusKeyReminder() {
  log(`\n${c.bold}Step 2: Census API Key (manual step)${c.reset}`);
  log(`Census ACS data is fetched on demand per tract — no bulk download needed.`);
  log(`However, without an API key, you'll be rate-limited to ~500 req/day.`);
  log(``);
  log(`  ${c.cyan}Get your free key at:${c.reset} https://api.census.gov/data/key_signup.html`);
  log(`  ${c.cyan}Then add to your .env:${c.reset} CENSUS_API_KEY=<your-key>`);
  log(``);

  const envPath = path.resolve(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("CENSUS_API_KEY")) {
      ok("CENSUS_API_KEY already present in root .env");
    } else {
      warn("CENSUS_API_KEY not found in root .env — add it before running in production");
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n${c.bold}${c.cyan}Plumbum Dataset Downloader${c.reset}`);
  log(`${"─".repeat(50)}`);

  try {
    await downloadEpaViolations();
  } catch (e) {
    err(`EPA download failed: ${e.message}`);
    err("The server will still start but EPA violation scores will use fallback values.");
  }

  printCensusKeyReminder();

  log(`\n${c.bold}Done!${c.reset} Start the server with: ${c.cyan}pnpm dev${c.reset}\n`);
}

main().catch(e => {
  err(`Unexpected error: ${e.message}`);
  process.exit(1);
});
