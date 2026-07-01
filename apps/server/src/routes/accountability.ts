import { Router } from "express";
import { geocodeAddress } from "./risk.js";
import { computeRealScore } from "../lib/scoreEngine.js";
import { hashAddress } from "../lib/encryption.js";
import {
  insertOrUpdateNotice,
  searchNotices,
  getUrgentNotices,
  getAccountabilityStats,
} from "../lib/landlordDb.js";
import crypto from "node:crypto";

const router = Router();

// ── Obfuscation Helper ────────────────────────────────────────────────────────

/**
 * Strips house numbers from geocoded address for renter privacy.
 * E.g., "124 Vassar Ave, Newark, NJ 07112, USA" -> "Vassar Ave, Newark, NJ 07112"
 */
function obfuscateAddress(geocodedAddress: string): string {
  if (!geocodedAddress) return "";
  const parts = geocodedAddress.split(",").map(p => p.trim());
  if (parts.length === 0) return "";

  const streetPart = parts[0];
  // Strip leading digits, ranges (e.g. 10-20), units (e.g. 124B), and trailing whitespace
  const obfuscatedStreet = streetPart
    .replace(/^\d+[-–]?\d*[A-Za-z]?\s+/, "")
    .trim();

  parts[0] = obfuscatedStreet;
  // Strip country suffix for concise display
  return parts.filter(p => !/^(United States|Canada|US|CA)$/i.test(p)).join(", ");
}

// ── POST /api/accountability ──────────────────────────────────────────────────

router.post("/accountability", async (req, res) => {
  const {
    address,
    landlord_name,
    management_company,
    notice_date,
    landlord_response,
    notes,
    submitter_anonymous_id,
  } = req.body as {
    address?: string;
    landlord_name?: string;
    management_company?: string;
    notice_date?: string;
    landlord_response?: string;
    notes?: string;
    submitter_anonymous_id?: string;
  };

  if (!address || typeof address !== "string" || !address.trim()) {
    res.status(400).json({ error: "Property address is required." });
    return;
  }

  if (!notice_date || typeof notice_date !== "string" || !notice_date.trim()) {
    res.status(400).json({ error: "Notification date is required." });
    return;
  }

  const validResponses = new Set([
    "PENDING",
    "AGREED_TO_TEST",
    "TESTED_NEGATIVE",
    "TESTED_POSITIVE",
    "REFUSED",
    "NO_RESPONSE",
  ]);

  if (!landlord_response || !validResponses.has(landlord_response.toUpperCase())) {
    res.status(400).json({ error: "A valid landlord response option is required." });
    return;
  }

  try {
    // 1. Geocode the address dynamically to ensure validity and retrieve score
    const geocoded = await geocodeAddress(address);
    if (!geocoded) {
      res.status(404).json({
        error: "We couldn't locate this address. Please verify city and state or zip code.",
      });
      return;
    }

    if (geocoded.country === "ca") {
      res.status(400).json({ error: "We only support tracking US landlord notifications at this time." });
      return;
    }

    // 2. Fetch risk score from the scoring engine
    const scoreResult = await computeRealScore({
      stateFips: geocoded.stateFips,
      countyFips: geocoded.countyFips,
      tractCode: geocoded.tractCode,
      geoid: geocoded.censusTract,
    });

    const score = Math.round(scoreResult.score);

    // 3. Hash the address for verification key
    const addressHash = hashAddress(geocoded.geocodedAddress);

    // 4. Obfuscate address for privacy
    const obfuscated = obfuscateAddress(geocoded.geocodedAddress);

    // 5. Generate submission token/anonymous ID if client didn't supply one
    const anonId = submitter_anonymous_id || crypto.randomUUID();

    // 6. Write or update notice in DB
    const insertId = await insertOrUpdateNotice({
      property_address: obfuscated,
      property_address_hash: addressHash,
      risk_score: score,
      landlord_name: landlord_name || "",
      management_company: management_company || "",
      notice_date: notice_date,
      landlord_response: landlord_response.toUpperCase(),
      submitter_anonymous_id: anonId,
      notes: notes || "",
    });

    req.log.info({ hash: addressHash, score }, "Landlord notice logged successfully");
    res.json({ ok: true, id: insertId, score, address: obfuscated });
  } catch (err) {
    req.log.error({ err }, "Failed to log landlord notice");
    res.status(500).json({ error: "Server encountered an error saving landlord notice. Please try again." });
  }
});

// ── GET /api/accountability ───────────────────────────────────────────────────

router.get("/accountability", async (req, res) => {
  const { query, sort, tab } = req.query as {
    query?: string;
    sort?: string;
    tab?: string;
  };

  try {
    const sortBy = sort === "urgent" ? "urgent" : "recent";
    
    let list;
    if (tab === "unresolved") {
      list = await getUrgentNotices();
    } else {
      list = await searchNotices(query || "", sortBy);
    }

    res.json({ list });
  } catch (err: any) {
    // If the table doesn't exist yet in Supabase, return empty list gracefully
    const msg = String(err?.message || err);
    if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("42P01")) {
      req.log.warn("landlord_notices table not yet created — returning empty list");
      res.json({ list: [] });
      return;
    }
    req.log.error({ err }, "Failed to search landlord notices");
    res.status(500).json({ error: "Failed to retrieve database entries." });
  }
});

// ── GET /api/accountability/stats ─────────────────────────────────────────────

router.get("/accountability/stats", async (_req, res) => {
  try {
    const stats = await getAccountabilityStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to load database stats." });
  }
});

export default router;
