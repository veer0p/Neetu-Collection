-- Neetu Collection - Custom Profiles-based Auth
-- Created: 2026-02-12 00:29:16

-- 1. Profiles Table (Independent of Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL, -- Storing 4-digit PIN directly (hashed or plain as per user preference, using plain for simplicity in this flow)
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update existing tables to use a generic user_id
-- We'll modify the existing tables if they were already created 
-- to ensure they don't depend on auth.users for RLS.

-- Adjust Directory Table
ALTER TABLE IF EXISTS public.directory 
  DROP CONSTRAINT IF EXISTS directory_user_id_fkey,
  ALTER COLUMN user_id TYPE UUID;

-- Adjust Transactions Table
ALTER TABLE IF EXISTS public.transactions 
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
  ALTER COLUMN user_id TYPE UUID;

-- Disable RLS if it was enabled (optional, or we can use custom policies)
-- Given the user wants "profiles table only" and no Supabase Auth service,
-- we'll use a simpler security model for now by managing access in the app.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Ensure schema permissions for anon/authenticated (since we aren't using Supabase Auth, anon might be used if keys allow)
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.directory TO anon, authenticated, service_role;
GRANT ALL ON public.transactions TO anon, authenticated, service_role;
