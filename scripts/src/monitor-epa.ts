import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sgMail from "@sendgrid/mail";
import {
  getAllActiveSubscriptions,
  markNotified,
  type Subscription,
} from "../../apps/server/src/lib/subscriptionDb.js";
import { decrypt } from "../../apps/server/src/lib/encryption.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "contact@plumbummap.org";
const BASE_URL = process.env.API_URL || "http://localhost:8080";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("⚠️  SENDGRID_API_KEY is not set in .env. Emails will be logged to console instead of sent.");
}

interface EpaViolation {
  PWSID?: string;
  CONTAMINANT_CODE?: string;
  VIOLATION_TYPE_CODE?: string;
  VIOLATION_BEGIN_DATE?: string;
  COMPLIANCE_PERIOD_BEGIN_DATE?: string;
  VIOLATION_TYPE_NAME?: string;
}

const LEAD_COPPER_CODES = new Set(["PB90", "CU90", "PB", "CU"]);

/** Fetch violations for a PWSID from the EPA API */
async function fetchViolations(pwsid: string): Promise<EpaViolation[]> {
  if (!pwsid) return [];
  try {
    const url = `https://enviro.epa.gov/efservice/VIOLATION/PWSID/${pwsid}/JSON`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Plumbum/1.0 (lead-alert-monitor)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Failed to fetch violations for PWSID ${pwsid}:`, err);
    return [];
  }
}

/** Check if a violation date is newer than a threshold date */
function isNewer(violationDateStr: string | undefined, thresholdDateStr: string): boolean {
  if (!violationDateStr) return false;
  const vDate = new Date(violationDateStr);
  const tDate = new Date(thresholdDateStr);
  return !isNaN(vDate.getTime()) && !isNaN(tDate.getTime()) && vDate.getTime() > tDate.getTime();
}

/** Send email alert to a subscriber */
async function sendAlertEmail(sub: Subscription, decryptedEmail: string, violation: EpaViolation, isMock = false) {
  const pwsid = violation.PWSID || sub.pwsid || "Unknown PWSID";
  const violationCode = violation.VIOLATION_TYPE_CODE || "N/A";
  const date = violation.VIOLATION_BEGIN_DATE || violation.COMPLIANCE_PERIOD_BEGIN_DATE || "N/A";
  const description = violation.VIOLATION_TYPE_NAME || "Lead/Copper action level exceedance";
  const unsubUrl = `${BASE_URL}/api/unsubscribe?token=${sub.unsub_token}`;

  const subject = `[Plumbum Alert] New lead water violation in your district`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #c2410c;">⚠️ Plumbum Risk Alert</h2>
      <p>Hello,</p>
      <p>This is an automated alert from Plumbum. A new lead or copper violation has been reported in your water district's Safe Drinking Water Information System (SDWIS) record.</p>
      
      <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Violation Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-weight: bold; width: 120px;">Water System ID:</td>
            <td style="padding: 4px 0;">${pwsid}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Violation Code:</td>
            <td style="padding: 4px 0;">${violationCode}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Date:</td>
            <td style="padding: 4px 0;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: bold;">Description:</td>
            <td style="padding: 4px 0;">${description}</td>
          </tr>
        </table>
      </div>
      
      <p>We recommend reviewing local news, contacting your water provider for water testing, or discussing lead testing with your doctor.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #666;">
        You received this alert because you subscribed at Plumbum. 
        If you wish to stop receiving these alerts, you can <a href="${unsubUrl}" style="color: #2563eb; text-decoration: underline;">unsubscribe with 1-click</a>.
      </p>
    </div>
  `;

  if (isMock) {
    console.log(`\n--- [MOCK EMAIL] ---`);
    console.log(`To: ${decryptedEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log(`--------------------\n`);
    return;
  }

  if (SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: decryptedEmail,
        from: FROM_EMAIL,
        subject: subject,
        html: html,
      });
      console.log(`Sent email alert to ${decryptedEmail} for PWSID ${pwsid}`);
    } catch (err) {
      console.error(`Failed to send email via SendGrid to ${decryptedEmail}:`, err);
    }
  } else {
    console.log(`[CONSOLE LOG ONLY] Alert email to ${decryptedEmail} for PWSID ${pwsid}: ${subject}`);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const isMock = args.includes("--mock");

  console.log(`Starting EPA Violation Monitor (Mode: ${isMock ? "MOCK" : "REAL"})...`);

  let activeSubs: Subscription[];
  try {
    activeSubs = getAllActiveSubscriptions();
  } catch (err) {
    console.error("Failed to load active subscriptions from database:", err);
    process.exit(1);
  }

  if (activeSubs.length === 0) {
    console.log("No active subscriptions found. Exiting.");
    return;
  }

  console.log(`Found ${activeSubs.length} active subscriptions.`);

  if (isMock) {
    console.log("Simulating mock violation and sending mock emails...");
    const mockViolation: EpaViolation = {
      PWSID: "MI1234567",
      CONTAMINANT_CODE: "PB90",
      VIOLATION_TYPE_CODE: "PB90-AL-EXCEED",
      VIOLATION_BEGIN_DATE: new Date().toISOString().split("T")[0],
      VIOLATION_TYPE_NAME: "Lead Action Level Exceedance (Simulated Alert)",
    };

    for (const sub of activeSubs) {
      try {
        const decryptedEmail = decrypt(sub.email_enc);
        await sendAlertEmail(sub, decryptedEmail, mockViolation, true);
        markNotified(sub.id);
      } catch (err) {
        console.error(`Failed to process mock subscription ${sub.id}:`, err);
      }
    }
    console.log("Mock simulation completed.");
    return;
  }

  // Real run
  // Get unique active PWSIDs
  const pwsids = new Set(activeSubs.map(s => s.pwsid).filter(Boolean));
  console.log(`Polling EPA SDWIS violations for ${pwsids.size} unique water systems...`);

  const pwsidViolations: Record<string, EpaViolation[]> = {};
  for (const pwsid of pwsids) {
    console.log(`Fetching EPA data for PWSID: ${pwsid}...`);
    const violations = await fetchViolations(pwsid);
    const filtered = violations.filter(v => {
      const code = v.CONTAMINANT_CODE?.trim().toUpperCase() || "";
      return LEAD_COPPER_CODES.has(code);
    });
    pwsidViolations[pwsid] = filtered;
    console.log(`Found ${filtered.length} lead/copper violations for ${pwsid}`);
  }

  let sentCount = 0;
  for (const sub of activeSubs) {
    if (!sub.pwsid) continue;
    const violations = pwsidViolations[sub.pwsid] || [];
    
    // Find if there is any violation that is new (began after subscribed_at and after last_notified_at)
    const thresholdDate = sub.last_notified_at || sub.subscribed_at;
    const newViolations = violations.filter(v => {
      const dateStr = v.VIOLATION_BEGIN_DATE || v.COMPLIANCE_PERIOD_BEGIN_DATE;
      return isNewer(dateStr, thresholdDate);
    });

    if (newViolations.length > 0) {
      // Send alert for the newest violation
      const newestViolation = newViolations.sort((a, b) => {
        const dateA = new Date(a.VIOLATION_BEGIN_DATE || a.COMPLIANCE_PERIOD_BEGIN_DATE || 0).getTime();
        const dateB = new Date(b.VIOLATION_BEGIN_DATE || b.COMPLIANCE_PERIOD_BEGIN_DATE || 0).getTime();
        return dateB - dateA;
      })[0];

      try {
        const decryptedEmail = decrypt(sub.email_enc);
        await sendAlertEmail(sub, decryptedEmail, newestViolation, false);
        markNotified(sub.id);
        sentCount++;
      } catch (err) {
        console.error(`Failed to process subscription ${sub.id} notification:`, err);
      }
    }
  }

  console.log(`Monitor run finished. Sent ${sentCount} notifications.`);
}

run().catch(err => {
  console.error("Monitor execution failed:", err);
  process.exit(1);
});
