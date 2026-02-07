import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, User, Search, ArrowRightLeft, SlidersHorizontal, X, TrendingUp, Clock, ArrowRight } from "lucide-react";
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

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'kendaraan', label: 'Kendaraan' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'musik', label: 'Musik' },
  { value: 'olahraga', label: 'Olahraga' },
  { value: 'hobi_koleksi', label: 'Hobi' },
  { value: 'perlengkapan_rumah', label: 'Rumah' },
  { value: 'mainan_anak', label: 'Mainan' },
  { value: 'kantor_industri', label: 'Kantor' },
  { value: 'kesehatan_kecantikan', label: 'Beauty' },
  { value: 'properti', label: 'Properti' },
  { value: 'other', label: 'Lainnya' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru', icon: Clock },
  { value: 'price_low', label: 'Harga Terendah', icon: TrendingUp },
  { value: 'price_high', label: 'Harga Tertinggi', icon: TrendingUp },
];

const CONDITION_FILTER = [
  { value: 'all', label: 'Semua' },
  { value: 'new', label: 'Baru' },
  { value: 'like_new', label: 'Seperti Baru' },
  { value: 'good', label: 'Baik' },
];

const ITEMS_PER_PAGE = 12;

const Index = () => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: personalizedItems, trackItemView, trackSearch } = usePersonalizedFeed(100, 0);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, conditionFilter]);

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
    if (value >= 1000000) {
      return `Rp${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}jt`;
    }
    if (value >= 1000) {
      return `Rp${(value / 1000).toFixed(0)}rb`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const displayItems = user && personalizedItems.length > 0 ? personalizedItems : allItems;

  const filteredItems = displayItems.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.barter_preference.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (conditionFilter !== 'all' && item.condition !== conditionFilter) return false;
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price_low': return a.estimated_value - b.estimated_value;
      case 'price_high': return b.estimated_value - a.estimated_value;
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleItemClick = (item: Item) => {
    trackItemView(item.id);
    setSelectedItem(item);
  };

  const activeFilterCount = [
    selectedCategory !== 'all',
    conditionFilter !== 'all',
    sortBy !== 'newest',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setConditionFilter('all');
    setSortBy('newest');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-40 bg-background border-b px-3 py-2">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <div className="flex gap-2 px-3 py-2 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 px-3 py-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
        {/* Sticky Search Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-2 px-3 py-2">
            <h1 className="text-lg font-extrabold text-primary flex-shrink-0 tracking-tight">BARTR</h1>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 rounded-full bg-muted/50 border-0 text-sm focus-visible:ring-1"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex-shrink-0 p-2 rounded-full transition-colors ${
                showFilters || activeFilterCount > 0 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {!user && (
              <Button onClick={() => navigate('/auth')} size="sm" className="h-9 rounded-full text-xs flex-shrink-0">
                Login
              </Button>
            )}
          </div>

          {/* Category chips - no emojis */}
          <div 
            ref={categoryRef}
            className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-foreground hover:bg-muted'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 bg-background animate-fade-in">
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Urutkan</p>
                <div className="flex gap-1.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        sortBy === opt.value
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted/60 text-foreground hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Kondisi</p>
                <div className="flex gap-1.5 flex-wrap">
                  {CONDITION_FILTER.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setConditionFilter(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        conditionFilter === opt.value
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted/60 text-foreground hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-destructive font-medium flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Hapus semua filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick action banner */}
        {user && (
          <div className="px-3 py-2">
            <button
              onClick={() => navigate('/swipe')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Mulai Swipe & Barter</p>
                <p className="text-[10px] text-muted-foreground">Temukan match untuk barangmu</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Results info */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <p className="text-xs text-muted-foreground">
            {sortedItems.length} barang ditemukan
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary font-medium"
            >
              Reset
            </button>
          )}
        </div>

        {/* Main content */}
        <main className="px-2 pb-4 overflow-x-hidden">
          {sortedItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold mb-1">Tidak ada barang</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Coba kata kunci lain' : 'Belum ada barang di kategori ini'}
              </p>
              {(searchQuery || activeFilterCount > 0) && (
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="rounded-full">
                  Hapus Filter
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {paginatedItems.map((item) => (
                  <button 
                    key={item.id} 
                    className="text-left overflow-hidden rounded-xl border border-border/50 bg-card hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={item.photos[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-1.5 left-1.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-background/80 backdrop-blur-sm text-[9px] font-medium">
                          {CONDITION_LABELS[item.condition] || item.condition}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <h4 className="font-medium text-xs leading-tight line-clamp-2 min-h-[2rem]">
                        {item.name}
                      </h4>
                      
                      <p className="text-sm font-bold text-primary">
                        {formatPrice(item.estimated_value)}
                      </p>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{item.city || item.location?.split(' — ')[0]}</span>
                      </div>

                      <div className="flex items-center gap-1 pt-0.5">
                        <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                          {item.profiles?.profile_photo_url ? (
                            <img 
                              src={item.profiles.profile_photo_url} 
                              alt={item.profiles.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                              <User className="h-2 w-2 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {item.profiles?.username}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

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
