-- Neetu Collection - Accounting v2 Expense Link
-- Added: 2026-04-21 22:30:00

-- 1. Add expense_id to v2_transactions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='v2_transactions' AND column_name='expense_id') THEN
        ALTER TABLE public.v2_transactions ADD COLUMN expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Index for faster lookups/deletions
CREATE INDEX IF NOT EXISTS idx_v2_transactions_expense_id ON public.v2_transactions(expense_id);
