import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, User, Search, Sparkles, Heart, Tag, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { MobileLayout } from "@/components/MobileLayout";
import { Pagination } from "@/components/Pagination";
import { usePersonalizedFeed } from "@/hooks/usePersonalizedFeed";

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
  city?: string | null;
  district?: string | null;
  province?: string | null;
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

const CONDITION_LABELS: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti Baru',
  good: 'Baik',
  fair: 'Cukup Baik',
  worn: 'Bekas Pakai',
};

const ITEMS_PER_PAGE = 12;

const Index = () => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: personalizedItems, trackItemView, trackSearch } = usePersonalizedFeed(100, 0);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Debounce search tracking
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        trackSearch(searchQuery);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchItems = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Use personalized feed if available, otherwise use all items
  const displayItems = user && personalizedItems.length > 0 ? personalizedItems : allItems;

  // Filter by search only (no category filter)
  const filteredItems = displayItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.barter_preference.toLowerCase().includes(query);
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleItemClick = (item: Item) => {
    trackItemView(item.id);
    setSelectedItem(item);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <button 
                onClick={() => navigate('/')}
                className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
              >
                BARTR
              </button>
              {!user && (
                <Button onClick={() => navigate('/auth')}>
                  Login
                </Button>
              )}
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="aspect-square w-full rounded-t-lg" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
        {/* Header - simplified for mobile */}
        <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <button 
              onClick={() => navigate('/')}
              className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              BARTR
            </button>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <div className="hidden md:flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/swipe')}>
                      <Heart className="mr-2 h-4 w-4" />
                      Mode Swipe
                    </Button>
                    <Button onClick={() => navigate('/upload')}>
                      <Tag className="mr-2 h-4 w-4" />
                      Pasang Barang
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate('/profile')}
                    className="md:hidden"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Login
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section - compact for mobile */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
          <div className="container mx-auto px-4 py-6 md:py-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                {user ? 'Rekomendasi untukmu' : 'Platform BARTR Terpercaya'}
              </div>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                Tukar Barangmu <span className="text-primary">Mudah & Cepat</span>
              </h2>
              
              {/* Search Bar */}
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Cari barang yang kamu mau..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-5 rounded-xl border-2 focus:border-primary"
                  />
                </div>
              </div>

              {/* Stats - compact */}
              <div className="flex justify-center gap-6 pt-4">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-primary">{allItems.length}+</div>
                  <div className="text-xs text-muted-foreground">Barang</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-primary">1K+</div>
                  <div className="text-xs text-muted-foreground">Transaksi</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-primary">500+</div>
                  <div className="text-xs text-muted-foreground">Pengguna</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="container mx-auto px-4 py-4 md:py-8 overflow-x-hidden">
          {/* Items Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">
              {user ? '✨ Untukmu' : 'Temukan Barang'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} barang
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {searchQuery ? 'Tidak ada barang yang cocok' : 'Belum ada barang tersedia'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {user 
                  ? 'Jadi yang pertama pasang barang untuk ditukar!' 
                  : 'Login untuk mulai pasang barang dan barter dengan pengguna lain.'}
              </p>
              <Button onClick={() => navigate(user ? '/upload' : '/auth')}>
                {user ? 'Pasang Barang Pertama' : 'Login Sekarang'}
              </Button>
            </div>
          ) : (
            <>
              {/* Items Grid - 2 columns on mobile */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {paginatedItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border hover:border-primary/50"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={item.photos[0]}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <CardContent className="p-2 md:p-3 space-y-1">
                      <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                      
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.city || item.location?.split(' — ')[0]}</span>
                      </div>

                      <div className="bg-primary/5 p-2 rounded-md">
                        <p className="text-base md:text-lg font-bold text-primary">
                          {formatPrice(item.estimated_value)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                            {item.profiles?.profile_photo_url ? (
                              <img 
                                src={item.profiles.profile_photo_url} 
                                alt={item.profiles.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] truncate max-w-[60px]">
                            {item.profiles?.username}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {CONDITION_LABELS[item.condition] || item.condition}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </main>

        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default Index;
