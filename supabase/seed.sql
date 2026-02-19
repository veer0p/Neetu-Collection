-- Supabase Seed Script for Neetu Collection
-- This script populates the database with initial testing data.
-- It uses the auth.users table to associate data with the first available user.

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the first user (we use a generic UUID if auth.users is empty for testing compatibility)
    target_user_id := '00000000-0000-0000-0000-000000000001'; -- Default fallback

    -- 1. Insert Products into Directory
    INSERT INTO public.directory (user_id, name, type) VALUES
    (target_user_id, 'Sabyasachi Saree', 'Product'),
    (target_user_id, 'Manish Malhotra Suit', 'Product'),
    (target_user_id, 'Simple Cotton Kurta', 'Product'),
    (target_user_id, 'Zari Dupatta', 'Product')
    ON CONFLICT (user_id, name, type) DO NOTHING;

    -- 2. Insert Vendors, Customers, Pickups into Directory
    INSERT INTO public.directory (user_id, name, type, phone, address) VALUES
    (target_user_id, 'Rahul Textiles', 'Vendor', '9876543210', 'Surat Market'),
    (target_user_id, 'Anjali Sharma', 'Customer', '8888888888', 'Mumbai, Bandra'),
    (target_user_id, 'Suresh Driver', 'Pickup Person', '7777777777', 'Delhi Gate')
    ON CONFLICT (user_id, name, type) DO NOTHING;

    -- 3. Insert Sample Orders (into transactions table as per fix_schema.sql)
    INSERT INTO public.transactions (
        user_id, product_name, customer_name, vendor_name, 
        original_price, selling_price,
        date, customer_payment_status, vendor_payment_status
    ) VALUES
    -- Order 1: Delivered
    (
        target_user_id, 'Sabyasachi Saree', 'Anjali Sharma', 'Rahul Textiles',
        12000, 15000,
        '19/02/2026', 'Paid', 'Paid'
    ),
    -- Order 2: Udhar
    (
        target_user_id, 'Manish Malhotra Suit', 'Anjali Sharma', 'Rahul Textiles',
        18000, 25000,
        '18/02/2026', 'Udhar', 'Udhar'
    );

END $$;
