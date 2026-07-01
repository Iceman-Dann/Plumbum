import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { getSupabaseClient } from "@workspace/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabase = getSupabaseClient();

function hashAddress(addr: string): string {
  return crypto.createHash("sha256").update(addr.toLowerCase().trim()).digest("hex");
}

async function main() {
  // ── RESET SEARCHES ──
  console.log("Clearing existing searches from Supabase...");
  const { error: deleteErr } = await supabase
    .from("searches")
    .delete()
    .gt("created_at", "1970-01-01T00:00:00Z");

  if (deleteErr) {
    console.error("Error clearing searches table:", deleteErr);
    process.exit(1);
  }
  console.log("Searches table cleared.");

  console.log("Reading seed-searches.sql...");
  const sqlPath = path.join(__dirname, "../seed-searches.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");

  // Match: ('fips', score, lat, lng, 'city', 'session_id', NOW() - INTERVAL 'X days')
  const regex = /\(\s*'([a-z0-9]+)'\s*,\s*(\d+)\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s+days?'\s*\)/gi;
  let match;
  const rows: any[] = [];
  while ((match = regex.exec(sqlContent)) !== null) {
    const [_, fips, scoreStr, latStr, lngStr, city, session_id, daysStr] = match;
    const score = parseInt(scoreStr, 10);
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const daysAgo = parseInt(daysStr, 10);
    const created_at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    rows.push({
      fips,
      score,
      lat,
      lng,
      city,
      session_id,
      created_at,
      country: fips.toUpperCase().startsWith("CAN") ? "ca" : "us"
    });
  }

  console.log(`Parsed ${rows.length} searches rows to insert.`);

  if (rows.length === 0) {
    console.warn("No searches matched the regex.");
    process.exit(1);
  }

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`Inserting searches batch ${i / batchSize + 1}...`);
    const { error: insertErr } = await supabase.from("searches").insert(batch);
    if (insertErr) {
      console.error("Error inserting searches batch:", insertErr);
      process.exit(1);
    }
  }

  // ── RESET LANDLORD NOTICES ──
  console.log("Clearing existing landlord notices from Supabase...");
  const { error: deleteLandlordErr } = await supabase
    .from("landlord_notices")
    .delete()
    .gt("created_at", "1970-01-01T00:00:00Z");

  if (deleteLandlordErr) {
    console.warn("Error clearing landlord_notices table (it may not exist yet):", deleteLandlordErr);
    console.log("Please make sure you have run the landlord_notices table creation script in Supabase.");
  } else {
    console.log("Landlord notices table cleared.");

    // Seed data
    const landlordSeed = [
      {
        property_address: "Ridge Ave, Philadelphia, PA",
        risk_score: 88,
        landlord_name: "",
        management_company: "Goldman & Sons Management",
        notice_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        landlord_response: "REFUSED",
        submitter_anonymous_id: crypto.randomUUID(),
        notes: "Landlord refused to check plumbing, claimed they are not legally required to inspect internal lead lines.",
      },
      {
        property_address: "Pine St, Baltimore, MD",
        risk_score: 82,
        landlord_name: "John Doe",
        management_company: "Apex Rental Group",
        notice_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        landlord_response: "AGREED_TO_TEST",
        submitter_anonymous_id: crypto.randomUUID(),
        notes: "Agreed to hire a certified inspector to conduct pipe analysis in July.",
      },
      {
        property_address: "Vassar Ave, Newark, NJ",
        risk_score: 85,
        landlord_name: "",
        management_company: "Liberty Housing Corp",
        notice_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        landlord_response: "PENDING",
        submitter_anonymous_id: crypto.randomUUID(),
        notes: "Formal certified notice delivered. Waiting on their response window.",
      },
      {
        property_address: "Flatbush Ave, Brooklyn, NY",
        risk_score: 74,
        landlord_name: "Jane Smith",
        management_company: "Empire Management LLC",
        notice_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        landlord_response: "TESTED_NEGATIVE",
        submitter_anonymous_id: crypto.randomUUID(),
        notes: "Provided certified test results from City DEP showing lead below action level.",
      }
    ];

    const landlordRows = landlordSeed.map(l => ({
      ...l,
      property_address_hash: hashAddress(l.property_address),
      created_at: new Date().toISOString(),
      verified: 0,
      response_date: null
    }));

    console.log(`Inserting ${landlordRows.length} landlord notice rows...`);
    const { error: insertLandlordErr } = await supabase.from("landlord_notices").insert(landlordRows);
    if (insertLandlordErr) {
      console.error("Error inserting landlord notices:", insertLandlordErr);
      process.exit(1);
    }
    console.log("Landlord notices seeded successfully.");
  }

  console.log("Seeding complete successfully.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
