-- Neetu Collection - v2 Data Migration Script
-- This script moves data from 'transactions' to the new 'orders' and 'ledger' tables.

DO $$ 
DECLARE 
    trans RECORD;
    new_order_id UUID;
    v_id UUID;
    c_id UUID;
    p_id UUID;
    pickup_id UUID;
    tras_json JSONB;
    _paid_by_driver BOOLEAN;
    _pickup_payment_status TEXT;
    _vendor_payment_status TEXT;
    _customer_payment_status TEXT;
    _tracking_id TEXT;
    _courier_name TEXT;
    _notes TEXT;
BEGIN
    FOR trans IN SELECT * FROM public.transactions LOOP
        tras_json := row_to_json(trans)::jsonb;
        
        -- Safely extract fields that might be missing in older schemas
        _paid_by_driver := COALESCE((tras_json->>'paid_by_driver')::boolean, FALSE);
        
        IF (tras_json ? 'pickup_person_id') AND (tras_json->>'pickup_person_id' IS NOT NULL) THEN
             pickup_id := (tras_json->>'pickup_person_id')::uuid;
        ELSE
             pickup_id := NULL;
        END IF;

        _pickup_payment_status := COALESCE(tras_json->>'pickup_payment_status', 'Paid');
        _vendor_payment_status := COALESCE(tras_json->>'vendor_payment_status', 'Paid');
        _customer_payment_status := COALESCE(tras_json->>'customer_payment_status', 'Paid');
        _tracking_id := tras_json->>'tracking_id';
        _courier_name := tras_json->>'courier_name';
        _notes := tras_json->>'notes';

        -- 1. Try to match names to directory IDs
        SELECT id INTO v_id FROM public.directory WHERE name = trans.vendor_name AND type = 'Vendor' LIMIT 1;
        SELECT id INTO c_id FROM public.directory WHERE name = trans.customer_name AND type = 'Customer' LIMIT 1;
        SELECT id INTO p_id FROM public.directory WHERE name = trans.product_name AND type = 'Product' LIMIT 1;
        
        -- 2. Insert into Orders
        INSERT INTO public.orders (
            user_id, date, product_id, customer_id, vendor_id, 
            original_price, selling_price, paid_by_driver, pickup_person_id, 
            tracking_id, courier_name, notes, created_at
        ) VALUES (
            trans.user_id, trans.date, p_id, c_id, v_id,
            trans.original_price, trans.selling_price, _paid_by_driver, pickup_id,
            _tracking_id, _courier_name, _notes, trans.created_at
        ) RETURNING id INTO new_order_id;

        -- 3. Insert into Ledger (Sales)
        INSERT INTO public.ledger (user_id, order_id, person_id, amount, transaction_type, created_at)
        VALUES (trans.user_id, new_order_id, c_id, trans.selling_price, 'Sale', trans.created_at);

        -- 4. If customer paid, record payment
        IF _customer_payment_status = 'Paid' THEN
            INSERT INTO public.ledger (user_id, order_id, person_id, amount, transaction_type, created_at)
            VALUES (trans.user_id, new_order_id, c_id, -trans.selling_price, 'PaymentIn', trans.created_at);
        END IF;

        -- 5. Insert into Ledger (Purchase/Reimbursement)
        IF _paid_by_driver AND pickup_id IS NOT NULL THEN
            -- Purchase goes to Driver (as we owe them)
            INSERT INTO public.ledger (user_id, order_id, person_id, amount, transaction_type, created_at)
            VALUES (trans.user_id, new_order_id, pickup_id, -trans.original_price, 'Reimbursement', trans.created_at);
            
            -- If we paid driver back
            IF _pickup_payment_status = 'Paid' THEN
                INSERT INTO public.ledger (user_id, order_id, person_id, amount, transaction_type, created_at)
                VALUES (trans.user_id, new_order_id, pickup_id, trans.original_price, 'PaymentOut', trans.created_at);
            END IF;
        ELSE
            -- Purchase goes to Vendor
            INSERT INTO public.ledger (user_id, order_id, person_id, amount, transaction_type, created_at)
            VALUES (trans.user_id, new_order_id, v_id, -trans.original_price, 'Purchase', trans.created_at);
            
            -- If we paid vendor
            IF _vendor_payment_status = 'Paid' THEN
                INSERT INTO public.ledger (user_id, order_id, person_id, amount, transaction_type, created_at)
                VALUES (trans.user_id, new_order_id, v_id, trans.original_price, 'PaymentOut', trans.created_at);
            END IF;
        END IF;

    END LOOP;
END $$;
