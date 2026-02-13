-- Neetu Collection - Account-Based Schema (v2 Optimization)
-- NOTE: This script ONLY creates 'orders' and 'ledger' tables.
-- If you see errors about 'profiles' or 'directory' existing, it means you are likely 
-- running the wrong file (e.g. fix_schema.sql). This file is SAFE to run as is.

-- 1. Create Orders Table (Core Trade Data)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  date TEXT NOT NULL, -- DD/MM/YYYY
  product_id UUID REFERENCES public.directory(id),
  customer_id UUID REFERENCES public.directory(id),
  vendor_id UUID REFERENCES public.directory(id),
  original_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  paid_by_driver BOOLEAN DEFAULT FALSE,
  pickup_person_id UUID REFERENCES public.directory(id),
  tracking_id TEXT,
  courier_name TEXT,
  pickup_charges DECIMAL(12, 2) DEFAULT 0,
  customer_payment_status TEXT DEFAULT 'Udhar',
  pickup_payment_status TEXT DEFAULT 'Paid',
  margin DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Ledger Table (Financial History & Balances)
CREATE TABLE IF NOT EXISTS public.ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.directory(id),
  amount DECIMAL(12, 2) NOT NULL, -- Positive = They owe you / You received. Negative = You owe them / You paid.
  transaction_type TEXT NOT NULL, -- 'Sale', 'Purchase', 'PaymentIn', 'PaymentOut', 'Reimbursement'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Security & Permissions
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ledger DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.ledger TO anon, authenticated, service_role;
