-- =============================================
-- USER BEHAVIOR TRACKING FOR PERSONALIZATION
-- =============================================

-- Track user item views
CREATE TABLE public.user_item_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 1,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Track user search history
CREATE TABLE public.user_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_query TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, search_query)
);

-- Enable RLS
ALTER TABLE public.user_item_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_item_views
CREATE POLICY "Users can view their own item views" 
ON public.user_item_views 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own item views" 
ON public.user_item_views 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item views" 
ON public.user_item_views 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for user_search_history
CREATE POLICY "Users can view their own search history" 
ON public.user_search_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" 
ON public.user_search_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history" 
ON public.user_search_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- =============================================
-- REPORTING SYSTEM
-- =============================================

-- Create enum for report types
CREATE TYPE public.report_type AS ENUM ('user', 'item', 'conversation');

-- Create enum for report reasons
CREATE TYPE public.report_reason AS ENUM ('scam', 'fake_item', 'inappropriate_behavior', 'spam', 'other');

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'action_taken', 'dismissed');

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  report_type report_type NOT NULL,
  reported_user_id UUID,
  reported_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  reported_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Users can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" 
ON public.reports 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" 
ON public.reports 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- USER MODERATION
-- =============================================

-- Create enum for ban type
CREATE TYPE public.ban_type AS ENUM ('warning', 'temporary', 'permanent');

-- User bans table
CREATE TABLE public.user_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ban_type ban_type NOT NULL,
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_bans
CREATE POLICY "Users can view their own bans" 
ON public.user_bans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage bans" 
ON public.user_bans 
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- FUNCTION: Get personalized item feed
-- =============================================

CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  item_id UUID,
  relevance_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    -- Get categories from wishlisted items
    SELECT DISTINCT i.category, 3 as weight
    FROM wishlist w
    JOIN items i ON w.item_id = i.id
    WHERE w.user_id = p_user_id
    
    UNION ALL
    
    -- Get categories from right-swiped items
    SELECT DISTINCT i.category, 2 as weight
    FROM swipes s
    JOIN items i ON s.item_id = i.id
    WHERE s.swiper_id = p_user_id AND s.direction = 'right'
    
    UNION ALL
    
    -- Get categories from viewed items
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
      -- Recency score (0-20 points, newer items get higher score)
      GREATEST(0, 20 - EXTRACT(DAY FROM (now() - i.created_at)))
    )::NUMERIC as relevance_score
  FROM items i
  LEFT JOIN category_scores cs ON i.category::text = cs.category::text
  CROSS JOIN user_location ul
  WHERE i.is_active = true
    AND i.user_id != p_user_id
    -- Exclude already swiped items
    AND NOT EXISTS (
      SELECT 1 FROM swipes s 
      WHERE s.item_id = i.id AND s.swiper_id = p_user_id
    )
  ORDER BY relevance_score DESC, i.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Trigger for updated_at on reports
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();