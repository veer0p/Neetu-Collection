-- Neetu Collection - Comprehensive Schema Setup
-- Run this in your Supabase SQL Editor to fully initialize the database.

-- 1. Create Enumeration Types (Safe even if they exist)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'directory_type') THEN
    CREATE TYPE directory_type AS ENUM ('Vendor', 'Customer', 'Product', 'Pickup Person');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('Paid', 'Udhar');
  END IF;
END $$;

-- 2. Create Profiles Table (Independent Custom Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL, 
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Directory Table
CREATE TABLE IF NOT EXISTS public.directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- Generic UUID for custom auth scoping
  name TEXT NOT NULL,
  type directory_type NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

-- 4. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- Generic UUID for custom auth scoping
  date TEXT NOT NULL, -- Format: DD/MM/YYYY
  customer_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  original_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  margin DECIMAL(12, 2) GENERATED ALWAYS AS (selling_price - original_price) STORED,
  margin_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN original_price > 0 
    THEN ((selling_price - original_price) / original_price) * 100 
    ELSE 0 END
  ) STORED,
  vendor_payment_status payment_status DEFAULT 'Paid',
  customer_payment_status payment_status DEFAULT 'Paid',
  pickup_payment_status payment_status DEFAULT 'Paid', -- Tracks if app user paid the driver
  paid_by_driver BOOLEAN DEFAULT FALSE, -- Flag for when driver pays the shop
  pickup_person_id UUID REFERENCES public.directory(id), -- Specific pickup person
  tracking_id TEXT,
  courier_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Security & Permissions
-- Disable RLS to allow manual scoping in our custom auth flow
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.directory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;

-- Grant broad access for frontend interactions (Scoped by app logic)
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.directory TO anon, authenticated, service_role;
GRANT ALL ON public.transactions TO anon, authenticated, service_role;
