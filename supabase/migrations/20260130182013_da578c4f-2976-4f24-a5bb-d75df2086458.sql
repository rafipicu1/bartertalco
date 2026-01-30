-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'plus', 'pro');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  midtrans_order_id TEXT,
  midtrans_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create daily usage tracking table
CREATE TABLE public.user_daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  swipe_count INTEGER DEFAULT 0,
  proposal_count INTEGER DEFAULT 0,
  items_viewed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL, -- 'subscription', 'boost', 'single_post'
  amount INTEGER NOT NULL,
  tier subscription_tier,
  period TEXT, -- 'monthly', 'yearly', null for one-time
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'expired'
  midtrans_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create item boosts table
CREATE TABLE public.item_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boosted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_daily_usage
CREATE POLICY "Users can view their own usage"
  ON public.user_daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.user_daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can increment their usage"
  ON public.user_daily_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for item_boosts
CREATE POLICY "Users can view their own boosts"
  ON public.item_boosts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boosts"
  ON public.item_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all transactions"
  ON public.payment_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all usage"
  ON public.user_daily_usage FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS subscription_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier subscription_tier;
BEGIN
  SELECT tier INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Function to get tier limits
CREATE OR REPLACE FUNCTION public.get_tier_limits(p_tier subscription_tier)
RETURNS TABLE(
  daily_swipes INTEGER,
  active_items INTEGER,
  daily_proposals INTEGER,
  wishlist_limit INTEGER,
  daily_views INTEGER,
  can_boost BOOLEAN,
  has_insights BOOLEAN,
  priority_level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_tier
    WHEN 'free' THEN
      RETURN QUERY SELECT 20, 1, 3, 10, 30, false, false, 0;
    WHEN 'plus' THEN
      RETURN QUERY SELECT 999999, 5, 999999, 999999, 100, true, false, 1;
    WHEN 'pro' THEN
      RETURN QUERY SELECT 999999, 999999, 999999, 999999, 999999, true, true, 2;
  END CASE;
END;
$$;

-- Function to check and increment usage
CREATE OR REPLACE FUNCTION public.check_and_increment_usage(
  p_user_id UUID,
  p_usage_type TEXT
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, max_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier subscription_tier;
  v_limits RECORD;
  v_current INTEGER;
  v_max INTEGER;
  v_usage RECORD;
BEGIN
  -- Get user tier
  v_tier := public.get_user_tier(p_user_id);
  
  -- Get limits for tier
  SELECT * INTO v_limits FROM public.get_tier_limits(v_tier);
  
  -- Get or create today's usage
  INSERT INTO public.user_daily_usage (user_id, usage_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, usage_date) DO NOTHING;
  
  SELECT * INTO v_usage
  FROM public.user_daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  -- Check based on usage type
  CASE p_usage_type
    WHEN 'swipe' THEN
      v_current := v_usage.swipe_count;
      v_max := v_limits.daily_swipes;
    WHEN 'proposal' THEN
      v_current := v_usage.proposal_count;
      v_max := v_limits.daily_proposals;
    WHEN 'view' THEN
      v_current := v_usage.items_viewed;
      v_max := v_limits.daily_views;
    ELSE
      RETURN QUERY SELECT true, 0, 999999;
      RETURN;
  END CASE;
  
  -- Check if allowed
  IF v_current < v_max THEN
    -- Increment usage
    CASE p_usage_type
      WHEN 'swipe' THEN
        UPDATE public.user_daily_usage SET swipe_count = swipe_count + 1, updated_at = now()
        WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
      WHEN 'proposal' THEN
        UPDATE public.user_daily_usage SET proposal_count = proposal_count + 1, updated_at = now()
        WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
      WHEN 'view' THEN
        UPDATE public.user_daily_usage SET items_viewed = items_viewed + 1, updated_at = now()
        WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    END CASE;
    
    RETURN QUERY SELECT true, v_current + 1, v_max;
  ELSE
    RETURN QUERY SELECT false, v_current, v_max;
  END IF;
END;
$$;

-- Function to count user's active items
CREATE OR REPLACE FUNCTION public.get_user_active_items_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.items
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN v_count;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_daily_usage_updated_at
  BEFORE UPDATE ON public.user_daily_usage
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update personalized feed to consider priority
CREATE OR REPLACE FUNCTION public.get_personalized_feed(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(item_id uuid, relevance_score numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    SELECT DISTINCT i.category, 3 as weight
    FROM wishlist w
    JOIN items i ON w.item_id = i.id
    WHERE w.user_id = p_user_id
    
    UNION ALL
    
    SELECT DISTINCT i.category, 2 as weight
    FROM swipes s
    JOIN items i ON s.item_id = i.id
    WHERE s.swiper_id = p_user_id AND s.direction = 'right'
    
    UNION ALL
    
    SELECT DISTINCT i.category, 1 as weight
    FROM user_item_views uiv
    JOIN items i ON uiv.item_id = i.id
    WHERE uiv.user_id = p_user_id
  ),
  category_scores AS (
    SELECT category, SUM(weight) as category_weight
    FROM user_preferences
    GROUP BY category
  ),
  user_location AS (
    SELECT latitude, longitude, city, province
    FROM profiles
    WHERE id = p_user_id
  ),
  item_owner_tiers AS (
    SELECT i.id as item_id, COALESCE(us.tier, 'free') as owner_tier
    FROM items i
    LEFT JOIN user_subscriptions us ON i.user_id = us.user_id AND us.status = 'active'
  ),
  boosted_items AS (
    SELECT item_id FROM item_boosts WHERE is_active = true AND expires_at > now()
  )
  SELECT 
    i.id as item_id,
    (
      -- Category preference score (0-50 points)
      COALESCE(cs.category_weight * 10, 0) +
      -- Same city bonus (20 points)
      CASE WHEN i.city = ul.city THEN 20 ELSE 0 END +
      -- Same province bonus (10 points)
      CASE WHEN i.province = ul.province AND i.city != ul.city THEN 10 ELSE 0 END +
      -- Recency score (0-20 points)
      GREATEST(0, 20 - EXTRACT(DAY FROM (now() - i.created_at))) +
      -- Priority tier bonus (0-30 points)
      CASE 
        WHEN iot.owner_tier = 'pro' THEN 30
        WHEN iot.owner_tier = 'plus' THEN 15
        ELSE 0
      END +
      -- Boost bonus (50 points)
      CASE WHEN bi.item_id IS NOT NULL THEN 50 ELSE 0 END
    )::NUMERIC as relevance_score
  FROM items i
  LEFT JOIN category_scores cs ON i.category::text = cs.category::text
  CROSS JOIN user_location ul
  LEFT JOIN item_owner_tiers iot ON i.id = iot.item_id
  LEFT JOIN boosted_items bi ON i.id = bi.item_id
  WHERE i.is_active = true
    AND i.user_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM swipes s 
      WHERE s.item_id = i.id AND s.swiper_id = p_user_id
    )
  ORDER BY relevance_score DESC, i.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;