-- Add extra slots columns for paid limit increases
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS extra_proposal_slots integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_swipe_slots integer DEFAULT 0;