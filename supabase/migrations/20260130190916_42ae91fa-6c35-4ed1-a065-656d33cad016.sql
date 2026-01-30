-- Update get_personalized_feed to give MUCH higher priority to Plus/Pro users
-- so they always appear first (500+ points vs max ~100 for other factors)
CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(item_id UUID, relevance_score NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_location AS (
    SELECT city, province, latitude, longitude
    FROM profiles
    WHERE id = p_user_id
  ),
  category_scores AS (
    SELECT 
      i.category,
      COUNT(*)::NUMERIC / 10 as category_weight
    FROM user_item_views uiv
    JOIN items i ON i.id = uiv.item_id
    WHERE uiv.user_id = p_user_id
      AND uiv.last_viewed_at > now() - interval '30 days'
    GROUP BY i.category
    ORDER BY category_weight DESC
    LIMIT 5
  ),
  item_owner_tiers AS (
    SELECT 
      i.id as iot_item_id,
      COALESCE(us.tier, 'free') as owner_tier
    FROM items i
    LEFT JOIN user_subscriptions us ON us.user_id = i.user_id 
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  ),
  boosted_items AS (
    SELECT item_id as boosted_item_id
    FROM item_boosts
    WHERE is_active = true AND expires_at > now()
  )
  SELECT 
    i.id as item_id,
    (
      -- Priority tier bonus - VERY HIGH to always appear first (500+ points)
      CASE 
        WHEN iot.owner_tier = 'pro' THEN 600
        WHEN iot.owner_tier = 'plus' THEN 500
        ELSE 0
      END +
      -- Boost bonus (50 points)
      CASE WHEN bi.boosted_item_id IS NOT NULL THEN 50 ELSE 0 END +
      -- Category preference score (0-50 points)
      COALESCE(cs.category_weight * 10, 0) +
      -- Same city bonus (20 points)
      CASE WHEN i.city = ul.city THEN 20 ELSE 0 END +
      -- Same province bonus (10 points)
      CASE WHEN i.province = ul.province AND i.city != ul.city THEN 10 ELSE 0 END +
      -- Recency score (0-20 points)
      GREATEST(0, 20 - EXTRACT(DAY FROM (now() - i.created_at)))
    )::NUMERIC as relevance_score
  FROM items i
  LEFT JOIN category_scores cs ON i.category::text = cs.category::text
  CROSS JOIN user_location ul
  LEFT JOIN item_owner_tiers iot ON i.id = iot.iot_item_id
  LEFT JOIN boosted_items bi ON i.id = bi.boosted_item_id
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

-- Update check_and_increment_usage to skip limits for Plus/Pro users on proposals
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
  v_usage RECORD;
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  -- Get user's tier
  v_tier := get_user_tier(p_user_id);
  
  -- Get tier limits
  SELECT * INTO v_limits FROM get_tier_limits(v_tier);
  
  -- Get or create today's usage
  INSERT INTO user_daily_usage (user_id, usage_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, usage_date) DO NOTHING;
  
  SELECT * INTO v_usage
  FROM user_daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  -- Determine current and max based on usage type
  CASE p_usage_type
    WHEN 'swipe' THEN
      v_current := v_usage.swipe_count;
      v_max := v_limits.daily_swipes;
    WHEN 'proposal' THEN
      v_current := v_usage.proposal_count;
      -- Plus and Pro users have unlimited proposals
      IF v_tier IN ('plus', 'pro') THEN
        v_max := 999999;
      ELSE
        v_max := v_limits.daily_proposals;
      END IF;
    WHEN 'view' THEN
      v_current := v_usage.items_viewed;
      v_max := v_limits.daily_views;
    ELSE
      v_current := 0;
      v_max := 999999;
  END CASE;
  
  -- Check if allowed and increment if so
  IF v_current < v_max THEN
    CASE p_usage_type
      WHEN 'swipe' THEN
        UPDATE user_daily_usage SET swipe_count = swipe_count + 1, updated_at = now()
        WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
      WHEN 'proposal' THEN
        UPDATE user_daily_usage SET proposal_count = proposal_count + 1, updated_at = now()
        WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
      WHEN 'view' THEN
        UPDATE user_daily_usage SET items_viewed = items_viewed + 1, updated_at = now()
        WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    END CASE;
    
    RETURN QUERY SELECT true, v_current + 1, v_max;
  ELSE
    RETURN QUERY SELECT false, v_current, v_max;
  END IF;
END;
$$;