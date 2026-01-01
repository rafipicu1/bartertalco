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
  { value: 'all', label: 'Semua Kategori', icon: '🏪' },
  { value: 'elektronik', label: 'Elektronik', icon: '📱' },
  { value: 'fashion', label: 'Fashion', icon: '👕' },
  { value: 'kendaraan', label: 'Kendaraan', icon: '🚗' },
  { value: 'properti', label: 'Properti', icon: '🏠' },
  { value: 'hobi_koleksi', label: 'Hobi & Koleksi', icon: '🎨' },
  { value: 'olahraga', label: 'Olahraga', icon: '⚽' },
  { value: 'musik', label: 'Musik', icon: '🎸' },
  { value: 'makanan_minuman', label: 'Makanan & Minuman', icon: '🍔' },
  { value: 'kesehatan_kecantikan', label: 'Kesehatan & Kecantikan', icon: '💄' },
  { value: 'perlengkapan_rumah', label: 'Perlengkapan Rumah', icon: '🛋️' },
  { value: 'mainan_anak', label: 'Mainan Anak', icon: '🧸' },
  { value: 'kantor_industri', label: 'Kantor & Industri', icon: '💼' },
];

const Index = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchItems();
    getUserLocation();
  }, []);

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
    }).format(value);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">BARTR</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/swipe')}>Swipe Mode</Button>
              <Button onClick={() => navigate('/upload')}>Post Item</Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">BARTR</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/chat')} className="hover-scale relative">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/swipe')} className="hover-scale">
              <Heart className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Mode Swipe</span>
            </Button>
            <Button onClick={() => navigate('/upload')} className="hover-scale">
              <Tag className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Pasang Barang</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              Platform BARTR Terpercaya
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Tukar Barangmu dengan <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Mudah & Cepat</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Temukan ribuan barang menarik untuk ditukar. Tanpa uang, hanya tukar barang!
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari barang yang kamu inginkan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-xl border-2 focus:border-primary shadow-lg"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{items.length}+</div>
                <div className="text-sm text-muted-foreground">Barang Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Transaksi Sukses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Pengguna Aktif</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Kategori Populer
          </h3>
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`whitespace-nowrap flex items-center gap-2 min-w-fit snap-start flex-shrink-0 rounded-xl transition-all duration-300 ${
                    selectedCategory === category.value 
                      ? 'shadow-lg scale-105' 
                      : 'hover-scale'
                  }`}
                  size={window.innerWidth < 768 ? "sm" : "default"}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="hidden sm:inline font-medium">{category.label}</span>
                  <span className="sm:hidden font-medium">{category.label.split(' ')[0]}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold">
            {selectedCategory === 'all' ? 'Semua Barang' : `Kategori ${CATEGORIES.find(c => c.value === selectedCategory)?.label}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} barang ditemukan
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">Belum ada barang tersedia</p>
            <Button onClick={() => navigate('/upload')}>Pasang Barang Pertama</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50 animate-fade-in hover-scale"
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative h-56 overflow-hidden bg-muted">
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur text-primary-foreground shadow-lg">
                    {item.category}
                  </Badge>
                  
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className="bg-green-500/90 backdrop-blur text-white border-0">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Aktif
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{item.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                    {getDistance(item) && (
                      <>
                        <span className="mx-1">•</span>
                        <Navigation className="h-3 w-3 flex-shrink-0" />
                        <span>{getDistance(item)}</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Estimasi Nilai</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(item.estimated_value)}
                    </p>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Mau ditukar dengan
                    </p>
                    <p className="text-sm font-medium line-clamp-2">{item.barter_preference}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium truncate max-w-[120px]">
                        {item.profiles?.username || 'User'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.condition}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
  );
};

export default Index;
