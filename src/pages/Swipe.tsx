import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { SwipeCard } from '@/components/SwipeCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Plus, ArrowRight, RefreshCw, Package, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { useSubscription } from '@/hooks/useSubscription';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INDONESIA_LOCATIONS, getProvince, getCity } from '@/data/indonesiaLocations';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [step, setStep] = useState<SwipeStep>('select-item');
  
  // Location filters
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<{ name: string }[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<{ name: string }[]>([]);
  
  const { canSwipe, incrementUsage, getRemainingSwipes } = useSubscription();

  useEffect(() => {
    loadUserItems();
  }, [user]);

  useEffect(() => {
    if (step === 'swipe' && selectedUserItem) {
      setLoading(true);
      loadItems();
    }
  }, [step, selectedUserItem, selectedCategory, selectedProvince, selectedCity, selectedDistrict]);

  // Update available cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const provinceData = getProvince(selectedProvince);
      setAvailableCities(provinceData?.cities || []);
      setSelectedCity('');
      setSelectedDistrict('');
      setAvailableDistricts([]);
    } else {
      setAvailableCities([]);
      setSelectedCity('');
      setSelectedDistrict('');
      setAvailableDistricts([]);
    }
  }, [selectedProvince]);

  // Update available districts when city changes
  useEffect(() => {
    if (selectedProvince && selectedCity) {
      const cityData = getCity(selectedProvince, selectedCity);
      setAvailableDistricts(cityData?.districts || []);
      setSelectedDistrict('');
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedProvince, selectedCity]);

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

      // Filter by category
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      // Filter by location
      if (selectedProvince) {
        query = query.eq('province', selectedProvince);
      }
      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }
      if (selectedDistrict) {
        query = query.eq('district', selectedDistrict);
      }

      if (itemIds.length > 0 && selectedCategory === 'all' && !selectedProvince) {
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
      // Redirect to pricing with swipe limit message
      navigate('/pricing?limit=swipe');
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
                const formatPriceMsg = (value: number) => {
                  return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(value);
                };

                const matchMessage = `🎉 **MATCH!** 🎉\n\nKalian berdua saling suka! \n\n*${selectedUserItem.name}* (${formatPriceMsg(selectedUserItem.estimated_value)}) ↔️ *${currentItem.name}* (${formatPriceMsg(currentItem.estimated_value)})\n\nYuk lanjutkan diskusi untuk barter! 👇`;

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

  const handleStartSwipe = () => {
    setStep('swipe');
  };

  const handleChangeSettings = () => {
    setStep('select-item');
    setItems([]);
    setCurrentIndex(0);
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedDistrict('');
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getLocationLabel = () => {
    if (selectedDistrict) return `${selectedCity}, ${selectedDistrict}`;
    if (selectedCity) return selectedCity;
    if (selectedProvince) return selectedProvince;
    return 'Semua Lokasi';
  };

  // Loading state
  if (loading && step === 'select-item') {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center pb-20">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  // Step 1: Select Item
  if (step === 'select-item') {
    if (userItems.length === 0) {
      return (
        <MobileLayout>
          <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col items-center justify-center p-6 text-center pb-24">
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
          </div>
        </MobileLayout>
      );
    }

    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
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
        </div>
      </MobileLayout>
    );
  }

  // Step 2: Select Category & Location
  if (step === 'select-category') {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-24">
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
          <div className="p-4 text-center">
            <h1 className="text-xl font-bold mb-1">Cari Kategori Apa?</h1>
            <p className="text-sm text-muted-foreground">
              Pilih kategori barang yang kamu inginkan
            </p>
          </div>

          {/* Category Grid */}
          <div className="px-4 pb-4 grid grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <Card 
                key={cat.value} 
                className={`cursor-pointer transition-all hover:scale-[1.02] ${
                  selectedCategory === cat.value 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                <CardContent className="p-3 text-center">
                  <span className="text-2xl mb-1 block">{cat.icon}</span>
                  <h3 className="font-medium text-xs">{cat.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Location Filter */}
          <div className="px-4 pb-4">
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" />
                Filter Lokasi (Opsional)
              </div>
              
              {/* Province */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Provinsi</Label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Semua Provinsi" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                    <SelectItem value="">Semua Provinsi</SelectItem>
                    {INDONESIA_LOCATIONS.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              {selectedProvince && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Kota/Kabupaten</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Semua Kota" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                      <SelectItem value="">Semua Kota</SelectItem>
                      {availableCities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* District */}
              {selectedCity && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Kecamatan</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Semua Kecamatan" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                      <SelectItem value="">Semua Kecamatan</SelectItem>
                      {availableDistricts.map((d) => (
                        <SelectItem key={d.name} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Start Button */}
          <div className="px-4 pb-6">
            <Button 
              className="w-full h-12 text-lg gap-2" 
              onClick={handleStartSwipe}
            >
              Mulai Swipe
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Step 3: Swipe Mode
  const currentItem = items[currentIndex];
  const selectedCategoryLabel = CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label || 'Semua';

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col pb-20">
        {/* Compact Header */}
        <div className="p-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={selectedUserItem?.photos[0]}
                alt={selectedUserItem?.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{selectedUserItem?.name}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedCategoryLabel}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    <MapPin className="h-2.5 w-2.5 mr-0.5" />
                    {getLocationLabel()}
                  </Badge>
                </div>
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
        <main className="flex-1 flex items-center justify-center p-3">
          {loading ? (
            <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
          ) : currentItem ? (
            <div className="w-full max-w-sm">
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
              <p className="text-muted-foreground">
                Coba ubah filter kategori atau lokasi
              </p>
              <Button onClick={handleChangeSettings} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Ubah Filter
              </Button>
            </div>
          )}
        </main>
      </div>
    </MobileLayout>
  );
}
