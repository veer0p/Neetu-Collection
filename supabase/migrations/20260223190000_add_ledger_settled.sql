-- Add is_settled and settled_at columns to ledger table
-- This replaces the auto-PaymentOut/In pattern:
-- Instead of creating payment entries, we mark the base entries as settled.
-- Balance calculation excludes settled entries → net = 0 when fully settled.

ALTER TABLE ledger
  ADD COLUMN IF NOT EXISTS is_settled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
