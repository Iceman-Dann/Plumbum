# Supabase Database Setup for Plumbum

To store community water test results in Supabase, follow these instructions to create the database table and configure your environment variables.

## 1. Create the `test_results` Table in Supabase

Run the following SQL script in your Supabase project's **SQL Editor**:

```sql
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

-- Index by fips for fast lookup on tract level
CREATE INDEX IF NOT EXISTS idx_test_results_fips ON test_results(fips);
```

## 2. Environment Configuration

### Option A: Drizzle (Recommended Direct Connection)
Get your **URI Connection String** from Supabase (Database Settings > Connection string > URI).
Set it as your `DATABASE_URL` in your environment (e.g. in `.env` file at the root):

```env
DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### Option B: Supabase JS API Client
If you cannot use direct Postgres access (e.g. serverless or network policies), obtain the Project URL and API Key from Supabase (Project Settings > API) and set:

```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_KEY="your-anon-or-service-role-key"
```
