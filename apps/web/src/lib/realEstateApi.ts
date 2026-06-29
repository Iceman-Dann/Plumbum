// Fetch wrapper for POST /api/real-estate
// Returns the combined risk response for a real estate listing URL.

export interface RealEstateRiskFactor {
  name: string;
  score: number;
  max: number;
  detail: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";
}

export interface RealEstateResult {
  url: string;
  extracted_address: string;
  geocoded_address: string;
  score: number;
  risk_level: "Low" | "Moderate" | "High" | "Very High";
  factors: RealEstateRiskFactor[];
  lat: number;
  lng: number;
  census_tract: string;
  tract_fips: string;
  data_sources: string[];
  used_fallback?: boolean;
  pct_pre1986?: number | null;
  median_income?: number | null;
  epa_violations_10yr?: number;
  data_note?: string;
  country: "us" | "ca";
}

interface ApiError {
  error: string;
}

export async function checkRealEstateListing(url: string): Promise<RealEstateResult> {
  const res = await fetch("/api/real-estate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiError;
      if (body.error) msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<RealEstateResult>;
}
