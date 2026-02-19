-- Migration to add status_history column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.orders.status_history IS 'Stores the history of status changes and relevant dates as a JSON array';
