-- Fix existing Sale ledger entries to include shipping and pickup charges
-- Previously, Sale entries only stored selling_price. They should store:
-- selling_price + shipping_charges + pickup_charges (the full customer receivable)

UPDATE ledger
SET amount = o.selling_price + COALESCE(o.shipping_charges, 0) + COALESCE(o.pickup_charges, 0)
FROM orders o
WHERE ledger.order_id = o.id
  AND ledger.transaction_type = 'Sale';
