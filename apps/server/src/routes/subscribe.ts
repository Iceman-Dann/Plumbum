// POST   /api/subscribe          — create an email alert subscription
// DELETE /api/subscribe          — unsubscribe via token (?token=...)
// GET    /api/subscriptions/count — live count for homepage stats

import { Router } from "express";
import { encrypt, hashAddress, generateUnsubToken } from "../lib/encryption.js";
import {
  insertSubscription,
  isAlreadySubscribed,
  unsubscribeByToken,
  getActiveCount,
} from "../lib/subscriptionDb.js";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Attempt to look up a PWSID for a given census tract FIPS code via the
 * EPA SDWIS echo API. Falls back to an empty string if unavailable so the
 * subscription still works (the monitor will use FIPS matching instead).
 */
async function lookupPwsid(fips: string): Promise<string> {
  if (!fips || fips.length < 11) return "";
  try {
    const stateCode = fips.slice(0, 2);
    const countyFips = fips.slice(2, 5);
    // EPA ECHO REST service — public, no key required
    const url = new URL("https://data.epa.gov/efservice/WATER_SYSTEM/STATE_CODE/");
    const stateAbbr = stateCodeToAbbr(stateCode);
    if (!stateAbbr) return "";

    const apiUrl = `https://data.epa.gov/efservice/WATER_SYSTEM/PRIMACY_AGENCY_CODE/${stateAbbr}/COUNTY_SERVED/${countyFips}/JSON`;
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(6_000),
      headers: { "User-Agent": "Plumbum/1.0 (lead-risk; contact@plumbummap.org)" },
    });
    if (!res.ok) return "";
    const data = await res.json() as Array<{ PWSID?: string; PWS_ACTIVITY_CODE?: string }>;
    // Prefer active systems
    const active = data.find(s => s.PWS_ACTIVITY_CODE === "A" && s.PWSID);
    return active?.PWSID ?? data[0]?.PWSID ?? "";
  } catch {
    return "";
  }
}

// Minimal FIPS → state abbreviation map for EPA API calls
const FIPS_TO_STATE: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
  "11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA",
  "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN",
  "28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM",
  "36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA",
  "54":"WV","55":"WI","56":"WY",
};

function stateCodeToAbbr(fipsState: string): string | null {
  return FIPS_TO_STATE[fipsState] ?? null;
}

// ---------------------------------------------------------------------------
// POST /api/subscribe
// ---------------------------------------------------------------------------

router.post("/subscribe", async (req, res) => {
  const { email, address, score, censusTract } = req.body as {
    email?: string;
    address?: string;
    score?: number;
    censusTract?: string;
  };

  // Validate email
  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  if (!address || typeof address !== "string" || !address.trim()) {
    res.status(400).json({ error: "Address is required." });
    return;
  }

  const addressHash = hashAddress(address);

  // Check for duplicate
  if (isAlreadySubscribed(addressHash)) {
    res.json({
      ok: true,
      message: "You're already subscribed to alerts for this address.",
      already_subscribed: true,
    });
    return;
  }

  // Encrypt email
  let emailEnc: string;
  try {
    emailEnc = encrypt(email.trim().toLowerCase());
  } catch (err) {
    req.log.error({ err }, "Email encryption failed");
    res.status(500).json({ error: "Could not save subscription — please try again." });
    return;
  }

  // Look up PWSID (best-effort, non-blocking on failure)
  const fips = censusTract ?? "";
  const pwsid = await lookupPwsid(fips);

  const token = generateUnsubToken();

  try {
    insertSubscription({
      email_enc: emailEnc,
      pwsid,
      fips,
      address_hash: addressHash,
      risk_score: typeof score === "number" ? Math.round(score) : 0,
      unsub_token: token,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to insert subscription");
    res.status(500).json({ error: "Could not save subscription — please try again." });
    return;
  }

  req.log.info({ fips, pwsid, score }, "New alert subscription created");

  res.json({
    ok: true,
    message: "You're subscribed. We'll email you if new lead violations are filed for your water district.",
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/subscribe?token=...
// ---------------------------------------------------------------------------

router.delete("/subscribe", (req, res) => {
  const { token } = req.query as { token?: string };

  if (!token || typeof token !== "string" || !token.trim()) {
    res.status(400).json({ error: "Unsubscribe token is required." });
    return;
  }

  const found = unsubscribeByToken(token.trim());
  if (!found) {
    res.status(404).json({ error: "Token not found or already unsubscribed." });
    return;
  }

  req.log.info({}, "Unsubscribe via token");
  res.json({ ok: true, message: "You have been successfully unsubscribed." });
});

// ---------------------------------------------------------------------------
// GET /api/unsubscribe?token=...
// ---------------------------------------------------------------------------

router.get("/unsubscribe", (req, res) => {
  const { token } = req.query as { token?: string };

  if (!token || typeof token !== "string" || !token.trim()) {
    res.status(400).send(`
      <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #fecaca; background-color: #fef2f2; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Error</h2>
        <p>Unsubscribe token is required.</p>
      </div>
    `);
    return;
  }

  const found = unsubscribeByToken(token.trim());
  if (!found) {
    res.status(404).send(`
      <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #fecaca; background-color: #fef2f2; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Error</h2>
        <p>Token not found or already unsubscribed.</p>
      </div>
    `);
    return;
  }

  req.log.info({}, "Unsubscribed via GET link");
  res.send(`
    <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; border: 1px solid #bbf7d0; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <h2 style="color: #16a34a; margin-top: 0;">Successfully Unsubscribed</h2>
      <p>You have been successfully unsubscribed from Plumbum water quality alerts.</p>
    </div>
  `);
});

// ---------------------------------------------------------------------------
// GET /api/subscriptions/count  — public stat for homepage
// ---------------------------------------------------------------------------

router.get("/subscriptions/count", (_req, res) => {
  try {
    const count = getActiveCount();
    res.json({ count });
  } catch {
    res.json({ count: 0 });
  }
});

export default router;
