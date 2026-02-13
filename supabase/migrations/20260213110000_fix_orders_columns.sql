-- Fix missing columns for order creation
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vendor_payment_status TEXT DEFAULT 'Udhar';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_payment_status TEXT DEFAULT 'Udhar';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_payment_status TEXT DEFAULT 'Paid';

-- Handle margin column: convert from generated to regular
-- We must drop it first because it was likely created as a GENERATED column in earlier schema versions
ALTER TABLE public.orders DROP COLUMN IF EXISTS margin;
ALTER TABLE public.orders ADD COLUMN margin DECIMAL(12, 2) DEFAULT 0;

-- Ensure charges columns exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_charges DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_charges DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Booked';

-- Update comments
COMMENT ON COLUMN public.orders.vendor_payment_status IS 'Payment status to vendor: Paid, Udhar';
COMMENT ON COLUMN public.orders.customer_payment_status IS 'Payment status from customer: Paid, Udhar';
COMMENT ON COLUMN public.orders.pickup_payment_status IS 'Payment status to pickup person: Paid, Udhar';
