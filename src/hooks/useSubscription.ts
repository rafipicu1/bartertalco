import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type SubscriptionTier = 'free' | 'plus' | 'pro';

interface TierLimits {
  daily_swipes: number;
  active_items: number;
  daily_proposals: number;
  wishlist_limit: number;
  daily_views: number;
  can_boost: boolean;
  has_insights: boolean;
  priority_level: number;
}

interface DailyUsage {
  swipe_count: number;
  proposal_count: number;
  items_viewed: number;
}

interface Subscription {
  tier: SubscriptionTier;
  status: string;
  expires_at: string | null;
  extra_post_slots: number;
}

const FREE_LIMITS: TierLimits = {
  daily_swipes: 20,
  active_items: 1,
  daily_proposals: 3,
  wishlist_limit: 10,
  daily_views: 30,
  can_boost: false,
  has_insights: false,
  priority_level: 0,
};

const PLUS_LIMITS: TierLimits = {
  daily_swipes: 999999,
  active_items: 5,
  daily_proposals: 999999,
  wishlist_limit: 999999,
  daily_views: 100,
  can_boost: true,
  has_insights: false,
  priority_level: 1,
};

const PRO_LIMITS: TierLimits = {
  daily_swipes: 999999,
  active_items: 999999,
  daily_proposals: 999999,
  wishlist_limit: 999999,
  daily_views: 999999,
  can_boost: true,
  has_insights: true,
  priority_level: 2,
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<DailyUsage>({ swipe_count: 0, proposal_count: 0, items_viewed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
      loadDailyUsage();
    } else {
      setSubscription(null);
      setUsage({ swipe_count: 0, proposal_count: 0, items_viewed: 0 });
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check if subscription is expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setSubscription({ tier: 'free', status: 'expired', expires_at: null, extra_post_slots: (data as any).extra_post_slots || 0 });
        } else {
          setSubscription({
            tier: data.tier as SubscriptionTier,
            status: data.status,
            expires_at: data.expires_at,
            extra_post_slots: (data as any).extra_post_slots || 0,
          });
        }
      } else {
        setSubscription({ tier: 'free', status: 'active', expires_at: null, extra_post_slots: 0 });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription({ tier: 'free', status: 'active', expires_at: null, extra_post_slots: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyUsage = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUsage({
          swipe_count: data.swipe_count || 0,
          proposal_count: data.proposal_count || 0,
          items_viewed: data.items_viewed || 0,
        });
      }
    } catch (error) {
      console.error('Error loading daily usage:', error);
    }
  };

  const getTier = (): SubscriptionTier => subscription?.tier || 'free';

  const getLimits = (): TierLimits => {
    const tier = getTier();
    switch (tier) {
      case 'pro': return PRO_LIMITS;
      case 'plus': return PLUS_LIMITS;
      default: return FREE_LIMITS;
    }
  };

  const canSwipe = (): boolean => {
    const limits = getLimits();
    return usage.swipe_count < limits.daily_swipes;
  };

  const canPropose = (): boolean => {
    const limits = getLimits();
    return usage.proposal_count < limits.daily_proposals;
  };

  const canUploadItem = async (): Promise<boolean> => {
    if (!user) return false;
    
    const limits = getLimits();
    const extraSlots = subscription?.extra_post_slots || 0;
    const totalAllowedItems = limits.active_items + extraSlots;
    
    const { data, error } = await supabase
      .from('items')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) return false;
    return (data?.length || 0) < totalAllowedItems;
  };

  const incrementUsage = async (type: 'swipe' | 'proposal' | 'view') => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // First try to insert
    const { error: insertError } = await supabase
      .from('user_daily_usage')
      .insert({
        user_id: user.id,
        usage_date: today,
        swipe_count: type === 'swipe' ? 1 : 0,
        proposal_count: type === 'proposal' ? 1 : 0,
        items_viewed: type === 'view' ? 1 : 0,
      });

    if (insertError?.code === '23505') {
      // Already exists, update
      const column = type === 'swipe' ? 'swipe_count' : type === 'proposal' ? 'proposal_count' : 'items_viewed';
      const { data: current } = await supabase
        .from('user_daily_usage')
        .select(column)
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();

      if (current) {
        await supabase
          .from('user_daily_usage')
          .update({
            [column]: ((current as any)[column] || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('usage_date', today);
      }
    }

    // Refresh usage
    await loadDailyUsage();
  };

  const getRemainingSwipes = (): number => {
    const limits = getLimits();
    return Math.max(0, limits.daily_swipes - usage.swipe_count);
  };

  const getRemainingProposals = (): number => {
    const limits = getLimits();
    return Math.max(0, limits.daily_proposals - usage.proposal_count);
  };

  return {
    subscription,
    usage,
    loading,
    tier: getTier(),
    limits: getLimits(),
    canSwipe,
    canPropose,
    canUploadItem,
    incrementUsage,
    getRemainingSwipes,
    getRemainingProposals,
    refresh: () => {
      loadSubscription();
      loadDailyUsage();
    },
  };
}
