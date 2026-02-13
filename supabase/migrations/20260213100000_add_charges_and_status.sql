-- Add charges and status columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_charges DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_charges DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Booked';

-- Add comment for clarity
COMMENT ON COLUMN public.orders.status IS 'Status of the order: Booked, Shipped, Delivered, Canceled';
