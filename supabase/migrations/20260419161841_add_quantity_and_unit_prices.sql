-- Migration: Add Quantity and Unit Prices to Orders
-- Description: Adds quantity, unit_original_price, and unit_selling_price columns to the orders table.
-- Timestamp: 2026-04-19 16:18:41

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_original_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Update unit prices for existing orders to match total prices (since qty defaults to 1)
UPDATE public.orders 
SET unit_original_price = original_price,
    unit_selling_price = selling_price
WHERE unit_original_price = 0 AND unit_selling_price = 0;
