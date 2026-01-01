import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Tag, TrendingUp, Heart, User, Navigation, Search, Sparkles, Zap, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { calculateDistance, formatDistance } from "@/lib/geolocation";
import { MobileLayout } from "@/components/MobileLayout";
import { Pagination } from "@/components/Pagination";

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

const CATEGORIES = [
  { value: 'all', label: 'Semua', icon: '🏪' },
  { value: 'elektronik', label: 'Elektronik', icon: '📱' },
  { value: 'fashion', label: 'Fashion', icon: '👕' },
  { value: 'kendaraan', label: 'Kendaraan', icon: '🚗' },
  { value: 'properti', label: 'Properti', icon: '🏠' },
  { value: 'hobi_koleksi', label: 'Hobi', icon: '🎨' },
  { value: 'olahraga', label: 'Olahraga', icon: '⚽' },
  { value: 'musik', label: 'Musik', icon: '🎸' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'perlengkapan_rumah', label: 'Rumah', icon: '🛋️' },
];

const ITEMS_PER_PAGE = 12;

const Index = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchItems();
    getUserLocation();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const getUserLocation = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();
      
      if (data?.latitude && data?.longitude) {
        setUserLocation({ lat: data.latitude, lon: data.longitude });
      }
    }
  };

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
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (item: Item) => {
    if (!userLocation || !item.latitude || !item.longitude) return null;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lon,
      item.latitude,
      item.longitude
    );
    return formatDistance(distance);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
                  <CardHeader className="p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
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
      <div className="min-h-screen bg-background">
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
                Platform BARTR Terpercaya
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
                    placeholder="Cari barang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-5 rounded-xl border-2 focus:border-primary"
                  />
                </div>
              </div>

              {/* Stats - compact */}
              <div className="flex justify-center gap-6 pt-4">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-primary">{items.length}+</div>
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

        <main className="container mx-auto px-4 py-4 md:py-8">
          {/* Category Filter - horizontal scroll */}
          <div className="mb-4 md:mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  className="whitespace-nowrap flex items-center gap-1.5 min-w-fit flex-shrink-0 rounded-full text-sm h-9 px-4"
                  size="sm"
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Items Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">
              {selectedCategory === 'all' ? 'Semua Barang' : CATEGORIES.find(c => c.value === selectedCategory)?.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} barang
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">Belum ada barang tersedia</p>
              <Button onClick={() => navigate('/upload')}>Pasang Barang Pertama</Button>
            </div>
          ) : (
            <>
              {/* Items Grid - 2 columns on mobile */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {paginatedItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border hover:border-primary/50"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={item.photos[0]}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0.5">
                        {item.category}
                      </Badge>
                    </div>

                    <CardContent className="p-2 md:p-3 space-y-1">
                      <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                      
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.location?.split(' — ')[0]}</span>
                      </div>

                      <div className="bg-primary/5 p-2 rounded-md">
                        <p className="text-base md:text-lg font-bold text-primary">
                          {formatPrice(item.estimated_value)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-[10px] truncate max-w-[60px]">
                            {item.profiles?.username}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.condition}
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
