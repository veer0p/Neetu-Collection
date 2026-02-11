-- Neetu Collection - Initial Schema Migration
-- Created: 2026-02-12 00:17:14

-- 1. Directory (Vendors & Customers Master)
CREATE TYPE directory_type AS ENUM ('Vendor', 'Customer');

CREATE TABLE IF NOT EXISTS directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type directory_type NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate names per user/type
  UNIQUE(user_id, name, type)
);

-- 2. Transactions (Sales & Purchase records)
CREATE TYPE payment_status AS ENUM ('Paid', 'Udhar');

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
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
  tracking_id TEXT,
  courier_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Directory: Users can only see/edit their own contacts
CREATE POLICY "Users can manage own directory" ON directory
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Transactions: Users can only see/edit their own transactions
CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL TO authenticated USING (auth.uid() = user_id);
