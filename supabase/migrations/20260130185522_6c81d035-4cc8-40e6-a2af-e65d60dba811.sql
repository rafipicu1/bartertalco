-- Fix ambiguous column reference in get_personalized_feed
CREATE OR REPLACE FUNCTION public.get_personalized_feed(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(item_id uuid, relevance_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    SELECT i.id as iot_item_id, COALESCE(us.tier, 'free') as owner_tier
    FROM items i
    LEFT JOIN user_subscriptions us ON i.user_id = us.user_id AND us.status = 'active'
  ),
  boosted_items AS (
    SELECT ib.item_id as boosted_item_id FROM item_boosts ib WHERE ib.is_active = true AND ib.expires_at > now()
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
      CASE WHEN bi.boosted_item_id IS NOT NULL THEN 50 ELSE 0 END
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
$function$;