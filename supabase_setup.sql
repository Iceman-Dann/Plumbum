-- Run this file in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  fips VARCHAR(11) NOT NULL,
  test_date DATE NOT NULL,
  lead_ppb DOUBLE PRECISION NOT NULL,
  test_kit_brand VARCHAR(200),
  result_category VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_results_fips ON test_results(fips);

CREATE TABLE IF NOT EXISTS landlord_notices (
  id SERIAL PRIMARY KEY,
  property_address TEXT NOT NULL,
  property_address_hash TEXT NOT NULL UNIQUE,
  risk_score INTEGER NOT NULL,
  landlord_name TEXT,
  management_company TEXT,
  notice_date DATE NOT NULL,
  landlord_response VARCHAR(30) NOT NULL,
  response_date DATE,
  submitter_anonymous_id VARCHAR(36) NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_landlord_notices_address_hash ON landlord_notices(property_address_hash);
CREATE INDEX IF NOT EXISTS idx_landlord_notices_response ON landlord_notices(landlord_response);

CREATE TABLE IF NOT EXISTS searches (
  id SERIAL PRIMARY KEY,
  fips VARCHAR(11) NOT NULL,
  score INTEGER NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'us',
  city VARCHAR(100),
  session_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_searches_fips ON searches(fips);
CREATE INDEX IF NOT EXISTS idx_searches_created_country ON searches(created_at, country);

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  intended_use TEXT NOT NULL,
  key VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
