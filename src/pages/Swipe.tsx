import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { SwipeCard } from '@/components/SwipeCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Plus, ArrowRight, ArrowLeft, RefreshCw, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/UpgradeModal';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua Kategori', icon: '🔍' },
  { value: 'elektronik', label: 'Elektronik', icon: '📱' },
  { value: 'kendaraan', label: 'Kendaraan', icon: '🏍️' },
  { value: 'properti', label: 'Properti', icon: '🏠' },
  { value: 'fashion', label: 'Fashion', icon: '👕' },
  { value: 'hobi_koleksi', label: 'Hobi & Koleksi', icon: '🎨' },
  { value: 'olahraga', label: 'Olahraga', icon: '⚽' },
  { value: 'musik', label: 'Musik', icon: '🎸' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'perlengkapan_rumah', label: 'Rumah Tangga', icon: '🏡' },
  { value: 'mainan_anak', label: 'Mainan & Anak', icon: '🧸' },
  { value: 'kantor_industri', label: 'Kantor & Industri', icon: '💼' },
  { value: 'kesehatan_kecantikan', label: 'Kesehatan', icon: '💊' },
  { value: 'other', label: 'Lainnya', icon: '📦' },
];

type SwipeStep = 'select-item' | 'select-category' | 'swipe';

export default function Swipe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedItemIds, setLikedItemIds] = useState<Set<string>>(new Set());
  const [userItems, setUserItems] = useState<any[]>([]);
  const [selectedUserItem, setSelectedUserItem] = useState<any | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [step, setStep] = useState<SwipeStep>('select-item');
  
  const { canSwipe, incrementUsage, getRemainingSwipes, usage, limits } = useSubscription();

  useEffect(() => {
    loadUserItems();
  }, [user]);

  useEffect(() => {
    if (step === 'swipe' && selectedUserItem) {
      setLoading(true);
      loadItems();
    }
  }, [step, selectedUserItem, selectedCategory]);

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
    } catch (error) {
      console.error('Error loading user items:', error);
      toast.error('Gagal memuat barang kamu');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    if (!user || !selectedUserItem) return;

    try {
      const { data: swipedItems } = await supabase
        .from('swipes')
        .select('item_id')
        .eq('swiper_id', user.id)
        .eq('user_item_id', selectedUserItem.id);

      const swipedIds = swipedItems?.map(s => s.item_id) || [];

      const { data: likedItems } = await supabase
        .from('swipes')
        .select('item_id')
        .eq('swiper_id', user.id)
        .eq('user_item_id', selectedUserItem.id)
        .eq('direction', 'right');
      
      setLikedItemIds(new Set(likedItems?.map(s => s.item_id) || []));

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

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      if (itemIds.length > 0 && selectedCategory === 'all') {
        query = query.in('id', itemIds);
      }

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

    if (!canSwipe()) {
      setShowUpgradeModal(true);
      return;
    }

    const currentItem = items[currentIndex];

    try {
      await incrementUsage('swipe');

      if (direction === 'up') {
        await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            item_id: currentItem.id,
          });
        toast.success('Ditambahkan ke wishlist! ❤️');
      }

      if (direction === 'right' || direction === 'left') {
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
          const itemOwnerId = currentItem.user_id || currentItem.profiles?.user_id;
          
          if (itemOwnerId) {
            const { data: mutualSwipe } = await supabase
              .from('swipes')
              .select('*')
              .eq('swiper_id', itemOwnerId)
              .eq('item_id', selectedUserItem.id)
              .eq('direction', 'right')
              .maybeSingle();

            if (mutualSwipe) {
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
                return;
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

  const handleSelectItem = (item: any) => {
    setSelectedUserItem(item);
    setStep('select-category');
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setStep('swipe');
  };

  const handleChangeSettings = () => {
    setStep('select-item');
    setItems([]);
    setCurrentIndex(0);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Loading state
  if (loading && step === 'select-item') {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  // Step 1: Select Item
  if (step === 'select-item') {
    if (userItems.length === 0) {
      return (
        <MobileLayout showBottomNav={false}>
          <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Package className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Belum Ada Barang</h1>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Untuk mulai swipe, kamu perlu pasang barang dulu yang mau ditukar.
            </p>
            <Button onClick={() => navigate('/upload')} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Pasang Barang
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
              Kembali ke Beranda
            </Button>
          </div>
        </MobileLayout>
      );
    }

    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
          {/* Header */}
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pilih Barangmu</h1>
            <p className="text-muted-foreground">
              Barang mana yang mau kamu tukar?
            </p>
          </div>

          {/* Items Grid */}
          <div className="px-4 pb-6 grid grid-cols-2 gap-3">
            {userItems.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden"
                onClick={() => handleSelectItem(item)}
              >
                <div className="aspect-square relative">
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-primary font-medium mt-1">
                    {formatPrice(item.estimated_value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Back Button */}
          <div className="p-4 border-t bg-background">
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Step 2: Select Category
  if (step === 'select-category') {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
          {/* Header with selected item */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center gap-3">
              <img
                src={selectedUserItem?.photos[0]}
                alt={selectedUserItem?.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Menukar:</p>
                <h3 className="font-semibold truncate">{selectedUserItem?.name}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('select-item')}>
                Ganti
              </Button>
            </div>
          </div>

          {/* Category Header */}
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cari Kategori Apa?</h1>
            <p className="text-muted-foreground">
              Pilih kategori barang yang kamu inginkan
            </p>
          </div>

          {/* Category Grid */}
          <div className="px-4 pb-6 grid grid-cols-2 gap-3">
            {CATEGORY_OPTIONS.map((cat) => (
              <Card 
                key={cat.value} 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] hover:border-primary"
                onClick={() => handleSelectCategory(cat.value)}
              >
                <CardContent className="p-4 text-center">
                  <span className="text-3xl mb-2 block">{cat.icon}</span>
                  <h3 className="font-medium text-sm">{cat.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Step 3: Swipe Mode
  const currentItem = items[currentIndex];
  const selectedCategoryLabel = CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label || 'Semua';

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
        {/* Compact Header */}
        <div className="p-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={selectedUserItem?.photos[0]}
                alt={selectedUserItem?.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{selectedUserItem?.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {selectedCategoryLabel}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getRemainingSwipes()} swipe
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleChangeSettings}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Swipe Area */}
        <main className="flex-1 flex items-center justify-center p-4">
          {loading ? (
            <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
          ) : currentItem ? (
            <div className="w-full max-w-sm h-[500px] sm:h-[550px]">
              <SwipeCard
                key={currentItem.id}
                item={currentItem}
                onSwipe={handleSwipe}
                isLiked={likedItemIds.has(currentItem.id)}
              />
            </div>
          ) : (
            <div className="text-center space-y-4 px-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">Tidak ada barang lagi!</h2>
              <p className="text-muted-foreground text-sm">
                Kamu sudah melihat semua barang di kategori ini.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={loadItems} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Muat Ulang
                </Button>
                <Button onClick={handleChangeSettings}>
                  Ganti Kategori / Barang
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Swipe Instructions */}
        {currentItem && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            <span>← Skip</span>
            <span className="mx-4">↑ Wishlist</span>
            <span>Tertarik →</span>
          </div>
        )}
      </div>

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
