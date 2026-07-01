# Supabase Database Setup for Plumbum

To run Plumbum with Supabase, you need to create the database tables and configure your environment variables.

---

## Method 1: Drizzle Kit Auto-Push (Recommended)

If you are using **Option A (Direct Connection via `DATABASE_URL`)**, you don't need to manually run SQL scripts. You can let Drizzle Kit create and synchronize the database tables automatically:

1. Make sure you have `DATABASE_URL` set in your `.env` file at the project root.
2. Run the following command in the root folder:
   ```bash
   pnpm --filter @workspace/db push
   ```
This will inspect your schema files and create all necessary tables, columns, constraints, and indexes in your Supabase database.

---

## Method 2: Manual SQL Scripts (Supabase SQL Editor)

If you prefer to create tables manually or are using **Option B (Supabase JS Client)**, use the plain SQL file at [supabase_setup.sql](supabase_setup.sql) in your Supabase project's **SQL Editor**.

You can also paste the same SQL directly if you prefer, but do not include any markdown headings or code fences.

### 1. Create `test_results` Table
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

### 2. Create `landlord_notices` Table
```sql
CREATE TABLE IF NOT EXISTS landlord_notices (
  id SERIAL PRIMARY KEY,
  property_address TEXT NOT NULL,
  property_address_hash TEXT NOT NULL UNIQUE,
  risk_score INTEGER NOT NULL,
  landlord_name TEXT,
  management_company TEXT,
  notice_date DATE NOT NULL,
  landlord_response VARCHAR(30) NOT NULL, -- PENDING / AGREED_TO_TEST / TESTED_NEGATIVE / TESTED_POSITIVE / REFUSED / NO_RESPONSE
  response_date DATE,
  submitter_anonymous_id VARCHAR(36) NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_landlord_notices_address_hash ON landlord_notices(property_address_hash);
CREATE INDEX IF NOT EXISTS idx_landlord_notices_response ON landlord_notices(landlord_response);
```

### 3. Create `searches` Table
```sql
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
```

### 4. Create `api_keys` Table
```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  intended_use TEXT NOT NULL,
  key VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
```

---

## 3. Environment Configuration

### Option A: Drizzle (Recommended Direct Connection)
Get your **URI Connection String** from Supabase (Database Settings > Connection string > URI).
Set it as your `DATABASE_URL` in your environment (e.g. in `.env` file at the root):

```env
DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### Option B: Supabase JS API Client
If you cannot use direct Postgres access (e.g., in serverless environments or behind strict network policies), obtain the Project URL and API Key from Supabase (Project Settings > API) and set:

```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_KEY="your-anon-or-service-role-key"
```

