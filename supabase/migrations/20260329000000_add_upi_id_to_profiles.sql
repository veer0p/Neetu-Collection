-- Migration: Add UPI ID support to profiles table for Ledger Sharing QR codes
-- Created: 2026-03-29

-- Ensure the profiles table exists (it should, based on initial schema)
-- and add upi_id column if it doesn't exist.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Optional: Add a comment to the column for clarity
COMMENT ON COLUMN public.profiles.upi_id IS 'Store the business owner UPI ID for generating payment QR codes on statements.';
