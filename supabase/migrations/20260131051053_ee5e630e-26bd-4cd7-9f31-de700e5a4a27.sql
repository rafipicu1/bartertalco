-- Add extra_post_slots column to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS extra_post_slots INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.user_subscriptions.extra_post_slots IS 'Number of extra item slots purchased via single_post payment (Rp3.000 each)';