import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Item {
  id: string;
  user_id: string;
  name: string;
  description: string;
  detailed_minus: string;
  photos: string[];
  category: string;
  estimated_value: number;
  barter_preference: string;
  top_up_value: number;
  condition: string;
  location: string;
  city: string | null;
  district: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  profiles: {
    username: string;
    profile_photo_url: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export function usePersonalizedFeed(limit: number = 50, offset: number = 0) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPersonalizedFeed();
  }, [user, limit, offset]);

  const fetchPersonalizedFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      if (user) {
        // Get personalized feed for logged-in users
        const { data: feedData, error: feedError } = await supabase
          .rpc('get_personalized_feed', {
            p_user_id: user.id,
            p_limit: limit,
            p_offset: offset
          });

        if (feedError) throw feedError;

        if (feedData && feedData.length > 0) {
          const itemIds = feedData.map((f: any) => f.item_id);
          
          const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select(`
              *,
              profiles (
                username,
                profile_photo_url,
                latitude,
                longitude
              )
            `)
            .in('id', itemIds);

          if (itemsError) throw itemsError;

          // Sort items by the relevance order from the feed
          const sortedItems = itemIds.map((id: string) => 
            itemsData?.find(item => item.id === id)
          ).filter(Boolean) as Item[];

          setItems(sortedItems);
        } else {
          // Fallback to regular feed if no personalized results
          await fetchRegularFeed();
        }
      } else {
        // Regular feed for non-logged-in users
        await fetchRegularFeed();
      }
    } catch (err) {
      console.error('Error fetching personalized feed:', err);
      setError('Failed to fetch items');
      // Fallback to regular feed on error
      await fetchRegularFeed();
    } finally {
      setLoading(false);
    }
  };

  const fetchRegularFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles (
            username,
            profile_photo_url,
            latitude,
            longitude
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching regular feed:', err);
    }
  };

  const trackItemView = async (itemId: string) => {
    if (!user) return;

    try {
      // Try to insert first
      const { error: insertError } = await supabase
        .from('user_item_views')
        .insert({
          user_id: user.id,
          item_id: itemId,
          view_count: 1,
          last_viewed_at: new Date().toISOString()
        });

      // If duplicate, increment view count
      if (insertError?.code === '23505') {
        // Get current view count first
        const { data: existing } = await supabase
          .from('user_item_views')
          .select('view_count')
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .single();

        await supabase
          .from('user_item_views')
          .update({
            view_count: (existing?.view_count || 0) + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('item_id', itemId);
      }
    } catch (err) {
      console.error('Error tracking item view:', err);
    }
  };

  const trackSearch = async (query: string) => {
    if (!user || !query.trim()) return;

    try {
      const { error } = await supabase
        .from('user_search_history')
        .upsert(
          {
            user_id: user.id,
            search_query: query.trim().toLowerCase(),
            search_count: 1,
            last_searched_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,search_query'
          }
        );

      if (error) console.error('Error tracking search:', error);
    } catch (err) {
      console.error('Error tracking search:', err);
    }
  };

  return {
    items,
    loading,
    error,
    refetch: fetchPersonalizedFeed,
    trackItemView,
    trackSearch
  };
}
