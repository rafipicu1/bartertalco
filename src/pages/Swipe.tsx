import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { SwipeCard } from '@/components/SwipeCard';
import { Button } from '@/components/ui/button';
import { Sparkles, User, Plus, Heart, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';

export default function Swipe() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedItemIds, setLikedItemIds] = useState<Set<string>>(new Set());
  const [userItems, setUserItems] = useState<any[]>([]);
  const [selectedUserItem, setSelectedUserItem] = useState<any | null>(null);

  useEffect(() => {
    loadUserItems();
  }, [user]);

  useEffect(() => {
    if (selectedUserItem) {
      setLoading(true);
      loadItems();
    }
  }, [selectedUserItem]);

  const loadUserItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserItems(data || []);
      
      // Auto-select first item if available
      if (data && data.length > 0 && !selectedUserItem) {
        setSelectedUserItem(data[0]);
      }
    } catch (error) {
      console.error('Error loading user items:', error);
      toast.error('Gagal memuat barang kamu');
    }
  };

  const loadItems = async () => {
    if (!user || !selectedUserItem) return;

    try {
      // Get items that the user hasn't swiped on yet with this specific item
      const { data: swipedItems } = await supabase
        .from('swipes')
        .select('item_id')
        .eq('swiper_id', user.id)
        .eq('user_item_id', selectedUserItem.id);

      const swipedIds = swipedItems?.map(s => s.item_id) || [];

      // Get liked items for this specific user item
      const { data: likedItems } = await supabase
        .from('swipes')
        .select('item_id')
        .eq('swiper_id', user.id)
        .eq('user_item_id', selectedUserItem.id)
        .eq('direction', 'right');
      
      setLikedItemIds(new Set(likedItems?.map(s => s.item_id) || []));

      // Try to get personalized feed first
      const { data: feedData } = await supabase
        .rpc('get_personalized_feed', {
          p_user_id: user.id,
          p_limit: 50,
          p_offset: 0
        });

      let itemIds: string[] = [];
      if (feedData && feedData.length > 0) {
        itemIds = feedData.map((f: any) => f.item_id);
      }

      let query = supabase
        .from('items')
        .select(`
          *,
          profiles:user_id (
            username,
            location
          )
        `)
        .eq('is_active', true)
        .neq('user_id', user.id);

      // If we have personalized items, use those
      if (itemIds.length > 0) {
        query = query.in('id', itemIds);
      }

      // Only filter out swiped items if there are any
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setItems(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Gagal memuat barang');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (!user || !selectedUserItem || currentIndex >= items.length) return;

    const currentItem = items[currentIndex];

    try {
      if (direction === 'up') {
        // Add to wishlist
        await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            item_id: currentItem.id,
          });
        toast.success('Ditambahkan ke wishlist! ❤️');
      }

      if (direction === 'right' || direction === 'left') {
        // Record swipe with user's item
        const { error } = await supabase
          .from('swipes')
          .insert({
            swiper_id: user.id,
            user_item_id: selectedUserItem.id,
            item_id: currentItem.id,
            direction,
          });

        if (error) throw error;

        if (direction === 'right') {
          // Check if there's a match between these specific items
          const { data: match } = await supabase
            .from('matches')
            .select('*')
            .or(`item1_id.eq.${selectedUserItem.id},item2_id.eq.${selectedUserItem.id}`)
            .or(`item1_id.eq.${currentItem.id},item2_id.eq.${currentItem.id}`)
            .maybeSingle();

          if (match) {
            // Create conversation automatically
            const itemOwnerId = currentItem.user_id || currentItem.profiles?.user_id;
            
            if (itemOwnerId) {
              const { data: convo } = await supabase
                .from('conversations')
                .insert({
                  user1_id: user.id < itemOwnerId ? user.id : itemOwnerId,
                  user2_id: user.id < itemOwnerId ? itemOwnerId : user.id,
                  item1_id: selectedUserItem.id,
                  item2_id: currentItem.id,
                })
                .select()
                .single();

              toast.success("Cocok! 🎉", {
                description: `${selectedUserItem.name} match dengan ${currentItem.name}!`,
                action: convo ? {
                  label: 'Buka Chat',
                  onClick: () => navigate(`/chat/${convo.id}`)
                } : undefined,
              });
            }
          }
        }
      }

      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-rainbow flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <MobileLayout>
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BARTR
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <Home className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/upload')}
              className="rounded-full"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/wishlist')}
              className="rounded-full"
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              className="rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Swipe Area */}
      <main className="container mx-auto px-4 py-8 max-w-md">
        {/* User Items Selector */}
        {userItems.length === 0 ? (
          <div className="mb-4 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
            <p className="text-sm mb-3">
              ⚠️ Kamu belum punya barang untuk ditukar.
            </p>
            <Button onClick={() => navigate('/upload')} size="sm">
              Pasang Barang Pertama
            </Button>
          </div>
        ) : (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Barang yang mau kamu tukar:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {userItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedUserItem(item)}
                  className={`flex-shrink-0 w-32 cursor-pointer rounded-lg border-2 transition-all ${
                    selectedUserItem?.id === item.id
                      ? 'border-primary shadow-lg scale-105'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    className="w-full h-24 object-cover rounded-t-lg"
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedUserItem && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Rekomendasi barang untukmu ✨
              </p>
            )}
          </div>
        )}

        {selectedUserItem && currentItem ? (
          <div className="relative h-[600px]">
            <SwipeCard
              key={currentItem.id}
              item={currentItem}
              onSwipe={handleSwipe}
              isLiked={likedItemIds.has(currentItem.id)}
            />
          </div>
        ) : selectedUserItem && !currentItem ? (
          <div className="flex flex-col items-center justify-center h-[600px] text-center space-y-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Tidak ada barang lagi!</h2>
            <p className="text-muted-foreground max-w-sm">
              Kamu sudah melihat semua barang yang tersedia. Coba lagi nanti!
            </p>
            <Button
              onClick={loadItems}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              Muat Ulang
            </Button>
          </div>
        ) : null}
      </main>
    </MobileLayout>
  );
}
