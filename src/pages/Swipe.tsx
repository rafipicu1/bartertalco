import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { SwipeCard } from '@/components/SwipeCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User, Plus, Heart, Home, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/UpgradeModal';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'kendaraan', label: 'Kendaraan' },
  { value: 'properti', label: 'Properti' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'hobi_koleksi', label: 'Hobi & Koleksi' },
  { value: 'olahraga', label: 'Olahraga' },
  { value: 'musik', label: 'Musik' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'perlengkapan_rumah', label: 'Rumah Tangga' },
  { value: 'mainan_anak', label: 'Mainan & Anak' },
  { value: 'kantor_industri', label: 'Kantor & Industri' },
  { value: 'kesehatan_kecantikan', label: 'Kesehatan' },
  { value: 'other', label: 'Lainnya' },
];

export default function Swipe() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedItemIds, setLikedItemIds] = useState<Set<string>>(new Set());
  const [userItems, setUserItems] = useState<any[]>([]);
  const [selectedUserItem, setSelectedUserItem] = useState<any | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { canSwipe, incrementUsage, getRemainingSwipes, usage, limits } = useSubscription();

  useEffect(() => {
    loadUserItems();
  }, [user]);

  useEffect(() => {
    if (selectedUserItem) {
      setLoading(true);
      loadItems();
    }
  }, [selectedUserItem, selectedCategory]);

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

      // Apply category filter if selected
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      // If we have personalized items and no category filter, use those
      if (itemIds.length > 0 && selectedCategory === 'all') {
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

    // Check swipe limit
    if (!canSwipe()) {
      setShowUpgradeModal(true);
      return;
    }

    const currentItem = items[currentIndex];

    try {
      // Increment usage
      await incrementUsage('swipe');

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
        // Record swipe with user's item (upsert to handle duplicates)
        const { error } = await supabase
          .from('swipes')
          .upsert({
            swiper_id: user.id,
            user_item_id: selectedUserItem.id,
            item_id: currentItem.id,
            direction,
          }, {
            onConflict: 'swiper_id,item_id'
          });

        if (error && error.code !== '23505') throw error;

        if (direction === 'right') {
          // Check if there's a mutual like (the other person also liked our item)
          const itemOwnerId = currentItem.user_id || currentItem.profiles?.user_id;
          
          if (itemOwnerId) {
            // Check if the other person has swiped right on our item
            const { data: mutualSwipe } = await supabase
              .from('swipes')
              .select('*')
              .eq('swiper_id', itemOwnerId)
              .eq('item_id', selectedUserItem.id)
              .eq('direction', 'right')
              .maybeSingle();

            if (mutualSwipe) {
              // It's a match! Create or find conversation
              const { data: existingConvo } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(user1_id.eq.${user.id},user2_id.eq.${itemOwnerId}),and(user1_id.eq.${itemOwnerId},user2_id.eq.${user.id})`)
                .maybeSingle();

              let conversationId = existingConvo?.id;

              if (!existingConvo) {
                const { data: newConvo } = await supabase
                  .from('conversations')
                  .insert({
                    user1_id: user.id < itemOwnerId ? user.id : itemOwnerId,
                    user2_id: user.id < itemOwnerId ? itemOwnerId : user.id,
                    item1_id: user.id < itemOwnerId ? selectedUserItem.id : currentItem.id,
                    item2_id: user.id < itemOwnerId ? currentItem.id : selectedUserItem.id,
                  })
                  .select()
                  .single();
                
                conversationId = newConvo?.id;
              }

              if (conversationId) {
                // Send match message
                const formatPrice = (value: number) => {
                  return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(value);
                };

                const matchMessage = `🎉 **MATCH!** 🎉

Kalian berdua saling suka! 

*${selectedUserItem.name}* (${formatPrice(selectedUserItem.estimated_value)}) ↔️ *${currentItem.name}* (${formatPrice(currentItem.estimated_value)})

Yuk lanjutkan diskusi untuk barter! 👇`;

                await supabase
                  .from('messages')
                  .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: matchMessage,
                    message_type: 'match_notification',
                  });

                // Navigate directly to chat
                toast.success("🎉 Match! Kalian saling suka!", {
                  description: 'Membuka chat...',
                });
                
                navigate(`/chat/${conversationId}`, {
                  state: {
                    targetItem: currentItem,
                    myItem: selectedUserItem,
                    isMatch: true,
                  }
                });
                return; // Don't increment index, we're navigating away
              }
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
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-md overflow-x-hidden">
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
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Rekomendasi barang untukmu ✨
                </p>
                <p className="text-xs font-medium text-primary">
                  Swipe: {getRemainingSwipes()} tersisa
                </p>
          </div>
        )}

        {/* Category Filter */}
        {selectedUserItem && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter Kategori:</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORY_OPTIONS.map((cat) => (
                <Badge
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  className={`cursor-pointer whitespace-nowrap flex-shrink-0 transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                  {selectedCategory === cat.value && cat.value !== 'all' && (
                    <X 
                      className="ml-1 h-3 w-3" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory('all');
                      }}
                    />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
          </div>
        )}

        {selectedUserItem && currentItem ? (
          <div className="relative h-[500px] sm:h-[600px] max-w-full overflow-hidden">
            <SwipeCard
              key={currentItem.id}
              item={currentItem}
              onSwipe={handleSwipe}
              isLiked={likedItemIds.has(currentItem.id)}
            />
          </div>
        ) : selectedUserItem && !currentItem ? (
          <div className="flex flex-col items-center justify-center h-[400px] sm:h-[600px] text-center space-y-4 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Tidak ada barang lagi!</h2>
            <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
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

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="swipe"
        currentCount={usage.swipe_count}
        maxCount={limits.daily_swipes}
      />
    </MobileLayout>
  );
}
