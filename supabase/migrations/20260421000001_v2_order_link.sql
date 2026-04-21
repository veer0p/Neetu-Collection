-- Neetu Collection - Accounting v2 Integration
-- Add order_id to v2_transactions for tracking

ALTER TABLE public.v2_transactions 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- Update permissions just in case
GRANT ALL ON public.v2_transactions TO anon, authenticated, service_role;
