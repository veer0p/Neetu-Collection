-- Accounting System Overhaul Migration
-- Ensures schema supports accurate ledger tracking

-- 1. Add index on ledger(order_id) for efficient delete-and-recreate
CREATE INDEX IF NOT EXISTS idx_ledger_order_id ON public.ledger(order_id);

-- 2. Add index on ledger(person_id) for efficient balance lookups
CREATE INDEX IF NOT EXISTS idx_ledger_person_id ON public.ledger(person_id);

-- 3. Cleanup: Regenerate all ledger entries from existing orders
-- This ensures all old data uses the corrected accounting rules.
-- First, delete ALL order-linked ledger entries (manual payments have NULL order_id, they are safe)
DELETE FROM public.ledger WHERE order_id IS NOT NULL;

-- 4. Update column comments for clarity
COMMENT ON COLUMN public.ledger.amount IS 'Positive = Credit (they owe you / receivable). Negative = Debit (you owe them / payable).';
COMMENT ON COLUMN public.ledger.transaction_type IS 'Sale, Purchase, Expense, Reimbursement, PaymentIn, PaymentOut';
COMMENT ON COLUMN public.orders.vendor_payment_status IS 'Paid = settled, Udhar = you still owe vendor';
COMMENT ON COLUMN public.orders.customer_payment_status IS 'Paid = customer settled, Udhar = customer still owes you';
COMMENT ON COLUMN public.orders.pickup_payment_status IS 'Paid = pickup person settled, Udhar = you still owe pickup person';
