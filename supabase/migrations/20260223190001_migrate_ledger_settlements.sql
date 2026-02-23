-- Data migration: convert existing ledger from PaymentOut/In pattern to is_settled pattern.
-- For each Sale/Purchase/Expense entry that has a sibling PaymentIn/PaymentOut on the same order_id,
-- mark the base entry as settled (using the payment entry's created_at as settled_at),
-- then delete the now-redundant payment entries.

-- Step 1: Mark Sale entries as settled where the order has a PaymentIn sibling
UPDATE ledger base
SET
    is_settled = TRUE,
    settled_at = pay.created_at
FROM ledger pay
WHERE
    base.order_id IS NOT NULL
    AND base.order_id = pay.order_id
    AND base.transaction_type = 'Sale'
    AND pay.transaction_type = 'PaymentIn'
    AND base.person_id = pay.person_id
    AND base.is_settled = FALSE;

-- Step 2: Mark Purchase and Expense entries as settled where the order has a PaymentOut sibling
UPDATE ledger base
SET
    is_settled = TRUE,
    settled_at = pay.created_at
FROM ledger pay
WHERE
    base.order_id IS NOT NULL
    AND base.order_id = pay.order_id
    AND base.transaction_type IN ('Purchase', 'Expense')
    AND pay.transaction_type = 'PaymentOut'
    AND pay.notes IS DISTINCT FROM 'Paid by driver'  -- keep the driver reimbursement one
    AND base.is_settled = FALSE;

-- Step 3: Delete all auto-generated PaymentOut/In entries that were tied to orders
-- (manual payments added via "+ Pay" have no order_id so they are kept)
DELETE FROM ledger
WHERE
    order_id IS NOT NULL
    AND transaction_type IN ('PaymentIn', 'PaymentOut')
    AND notes IS DISTINCT FROM 'Paid by driver';  -- keep driver entries (they affect pickup person balance)
