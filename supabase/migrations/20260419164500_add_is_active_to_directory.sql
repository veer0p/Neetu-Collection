-- Soft Delete Implementation for Directory
-- Created: 2026-04-19 16:45:00

-- Add is_active column to directory table
ALTER TABLE public.directory 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records (just in case)
UPDATE public.directory SET is_active = TRUE WHERE is_active IS NULL;
