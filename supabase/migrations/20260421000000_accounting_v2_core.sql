-- Neetu Collection - Accounting v2 Core
-- Unified Transaction System

-- 1. Create v2_transactions table
CREATE TABLE IF NOT EXISTS public.v2_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    person_id UUID REFERENCES public.directory(id),
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('paid', 'due')),
    direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_time TIMESTAMPTZ DEFAULT NOW(),
    description TEXT,
    payment_for TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.v2_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own transactions" ON public.v2_transactions
    FOR ALL USING (auth.uid() = user_id);

-- 2. Add v2 balance columns to profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='v2_account_balance') THEN
        ALTER TABLE public.profiles ADD COLUMN v2_account_balance DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='v2_total_due') THEN
        ALTER TABLE public.profiles ADD COLUMN v2_total_due DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='v2_total_owe') THEN
        ALTER TABLE public.profiles ADD COLUMN v2_total_owe DECIMAL(12, 2) DEFAULT 0;
    END IF;
END $$;

-- 3. Create Trigger Function to sync balances
CREATE OR REPLACE FUNCTION public.sync_v2_balances()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        v2_account_balance = (
            SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0)
            FROM public.v2_transactions
            WHERE user_id = COALESCE(new.user_id, old.user_id) AND type = 'paid'
        ),
        v2_total_due = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.v2_transactions
            WHERE user_id = COALESCE(new.user_id, old.user_id) AND type = 'due' AND direction = 'in'
        ),
        v2_total_owe = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.v2_transactions
            WHERE user_id = COALESCE(new.user_id, old.user_id) AND type = 'due' AND direction = 'out'
        )
    WHERE id = COALESCE(new.user_id, old.user_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach Trigger
DROP TRIGGER IF EXISTS on_v2_transaction_change ON public.v2_transactions;
CREATE TRIGGER on_v2_transaction_change
    AFTER INSERT OR UPDATE OR DELETE ON public.v2_transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_v2_balances();

-- Permissions
GRANT ALL ON public.v2_transactions TO anon, authenticated, service_role;
