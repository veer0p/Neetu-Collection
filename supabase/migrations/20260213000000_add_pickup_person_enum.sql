-- Add 'Pickup Person' to directory_type enum
-- This handles the case where the enum already exists (from initial schema) 
-- but is missing this specific value.
ALTER TYPE directory_type ADD VALUE IF NOT EXISTS 'Pickup Person';
