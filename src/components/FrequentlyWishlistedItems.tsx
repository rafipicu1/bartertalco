import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Loader2, TrendingUp, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface WishlistedItem {
  id: string;
  name: string;
  photos: string[];
  estimated_value: number;
  category: string;
  wishlist_count: number;
}

interface FrequentlyWishlistedItemsProps {
  targetItemValue: number;
  onItemSelected: (itemId: string, itemName: string, itemValue: number, item: any) => void;
}

export function FrequentlyWishlistedItems({ targetItemValue, onItemSelected }: FrequentlyWishlistedItemsProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFrequentlyWishlistedItems();
  }, [user, targetItemValue]);

  const fetchFrequentlyWishlistedItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get items with most wishlist counts that belong to the user
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('item_id')
        .order('created_at', { ascending: false });

      if (wishlistError) throw wishlistError;

      // Count wishlist per item
      const itemCounts: Record<string, number> = {};
      wishlistData?.forEach(w => {
        itemCounts[w.item_id] = (itemCounts[w.item_id] || 0) + 1;
      });

      // Get the user's items that are frequently wishlisted
      const { data: userItems, error: userItemsError } = await supabase
        .from('items')
        .select('id, name, photos, estimated_value, category')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (userItemsError) throw userItemsError;

      // Filter items that have been wishlisted and sort by wishlist count
      const wishlistedUserItems = (userItems || [])
        .map(item => ({
          ...item,
          wishlist_count: itemCounts[item.id] || 0
        }))
        .filter(item => item.wishlist_count > 0)
        .sort((a, b) => b.wishlist_count - a.wishlist_count)
        .slice(0, 5);

      setItems(wishlistedUserItems);
    } catch (error) {
      console.error('Error fetching frequently wishlisted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-secondary">
        <TrendingUp className="h-4 w-4" />
        <span>Barang Populermu (Sering di-Wishlist)</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Barang ini diminati banyak orang! Bisa jadi opsi tukar yang menarik.
      </p>
      <div className="grid gap-2">
        {items.map((item) => {
          const valueDiff = targetItemValue - item.estimated_value;
          return (
            <Card
              key={item.id}
              className="p-3 cursor-pointer hover:border-secondary transition-colors"
              onClick={() => onItemSelected(item.id, item.name, item.estimated_value, item)}
            >
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.photos[0] ? (
                    <img
                      src={item.photos[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-primary">{formatPrice(item.estimated_value)}</p>
                  {valueDiff > 0 && (
                    <p className="text-xs text-muted-foreground">
                      + Tambah {formatPrice(valueDiff)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-secondary">
                  <Heart className="h-4 w-4 fill-secondary" />
                  <span className="text-sm font-medium">{item.wishlist_count}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
