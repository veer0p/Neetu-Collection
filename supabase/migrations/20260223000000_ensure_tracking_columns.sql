-- Ensure tracking_id and courier_name exist in orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;

COMMENT ON COLUMN public.orders.tracking_id IS 'Tracking ID / AWB number for the shipment';
COMMENT ON COLUMN public.orders.courier_name IS 'Name of the courier service';
