-- Fix 1: Add UPDATE policy for swipes table (required for upsert)
CREATE POLICY "Users can update their own swipes"
ON public.swipes
FOR UPDATE
USING (auth.uid() = swiper_id)
WITH CHECK (auth.uid() = swiper_id);

-- Fix 2: Fix ambiguous item_id in get_personalized_feed function
CREATE OR REPLACE FUNCTION public.get_personalized_feed(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(item_id uuid, relevance_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    SELECT ib.item_id as boosted_item_id
    FROM item_boosts ib
    WHERE ib.is_active = true AND ib.expires_at > now()
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
$function$;

-- Fix 3: Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for avatars - public read
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Storage policy for avatars - users can upload their own
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy for avatars - users can update their own
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy for avatars - users can delete their own
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);