-- Update default status to Pending
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'Pending';

-- Update existing records if any (optional, but good for consistency)
-- UPDATE public.orders SET status = 'Pending' WHERE status IS NULL OR status = 'Booked';

-- Update comment
COMMENT ON COLUMN public.orders.status IS 'Status of the order: Pending, Booked, Shipped, Delivered, Canceled';
