import { Router } from "express";
import { getDb, apiKeysTable } from "@workspace/db";
import sgMail from "@sendgrid/mail";
import crypto from "crypto";

const router = Router();
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "contact@plumbum.io";
const BASE_URL = process.env.VITE_PUBLIC_URL || "https://plumbum.io";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

router.post("/request", async (req, res) => {
  const { name, email, intended_use } = req.body;

  if (!name || !email || !intended_use) {
    res.status(400).json({ error: "Missing required fields: name, email, intended_use" });
    return;
  }

  // Generate a new API key
  const key = "pb_" + crypto.randomBytes(24).toString("hex");

  try {
    const db = getDb();
    
    // Attempt to save to database
    await db.insert(apiKeysTable).values({
      name,
      email,
      intended_use,
      key,
    });

    // Send Welcome Email
    if (SENDGRID_API_KEY) {
      const subject = `Welcome to Plumbum API`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome, ${name}!</h2>
          <p>Your Plumbum API key has been successfully generated.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all;">
            <strong>API Key:</strong> ${key}
          </div>
          <p>Please keep this key secure. You can review our full documentation here: <a href="${BASE_URL}/api-docs">${BASE_URL}/api-docs</a></p>
          <p>Thank you for building with Plumbum.</p>
        </div>
      `;
      try {
        await sgMail.send({
          to: email,
          from: FROM_EMAIL,
          subject,
          html,
        });
      } catch (err) {
        req.log.error({ err }, "Failed to send API key email via SendGrid");
      }
    } else {
      req.log.warn("SENDGRID_API_KEY not set. Did not send welcome email.");
    }

    res.status(201).json({ success: true, key });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create API key");
    res.status(500).json({ error: "Failed to generate API key." });
  }
});

export default router;
