import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Trash2, TrendingUp, Package, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { PageHeader } from '@/components/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useSubscription } from '@/hooks/useSubscription';

const CONDITION_LABELS: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti Baru',
  good: 'Baik',
  fair: 'Cukup Baik',
  worn: 'Bekas Pakai',
};

export default function Katalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { limits, subscription } = useSubscription();

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) throw error;
      toast.success('Barang berhasil dihapus');
      loadItems();
      setSelectedItem(null);
    } catch (error) {
      toast.error('Gagal menghapus barang');
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const activeCount = items.filter(i => i.is_active).length;
  const maxSlots = limits.active_items + (subscription?.extra_post_slots || 0);

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-muted flex items-center justify-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-muted">
        <PageHeader 
          title="Katalog Saya" 
          onBack={() => navigate('/')}
          rightContent={
            <Button size="sm" onClick={() => navigate('/upload')} className="gap-1.5 rounded-full h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Upload
            </Button>
          }
        />

        <main className="container mx-auto px-3 py-4 max-w-4xl space-y-4">
          {/* Stats bar */}
          <div className="flex items-center justify-between bg-card rounded-xl p-3 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{items.length} Barang</p>
                <p className="text-[10px] text-muted-foreground">{activeCount}/{maxSlots} slot aktif</p>
              </div>
            </div>
            <Badge variant={activeCount >= maxSlots ? "destructive" : "secondary"} className="text-xs">
              {activeCount >= maxSlots ? 'Slot Penuh' : `${maxSlots - activeCount} slot tersisa`}
            </Badge>
          </div>

          {/* Items grid */}
          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Etalase Kosong</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                  Mulai upload barangmu dan temukan match untuk barter!
                </p>
                <Button onClick={() => navigate('/upload')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Barang Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  className="text-left overflow-hidden rounded-xl border border-border/50 bg-card hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={item.photos[0] || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {!item.is_active && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="secondary" className="text-xs">Nonaktif</Badge>
                      </div>
                    )}
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
                  </div>
                </button>
              ))}

              {/* Upload card */}
              <button
                onClick={() => navigate('/upload')}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary">Upload Barang</span>
              </button>
            </div>
          )}
        </main>

        {/* Item Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem?.name}</DialogTitle>
            </DialogHeader>
            
            {selectedItem && (
              <div className="space-y-4">
                <Carousel className="w-full">
                  <CarouselContent>
                    {selectedItem.photos.map((photo: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                          <img
                            src={photo}
                            alt={`${selectedItem.name} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {selectedItem.photos.length > 1 && (
                    <>
                      <CarouselPrevious />
                      <CarouselNext />
                    </>
                  )}
                </Carousel>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-primary text-primary-foreground">{selectedItem.category}</Badge>
                    <Badge variant="outline">
                      {CONDITION_LABELS[selectedItem.condition] || selectedItem.condition}
                    </Badge>
                    {!selectedItem.is_active && (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Estimasi Nilai</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(selectedItem.estimated_value)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Mau ditukar dengan
                    </p>
                    <p className="font-medium">{selectedItem.barter_preference}</p>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-1">Deskripsi</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-1 text-destructive">Kekurangan / Minus</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.detailed_minus}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedItem.location}</span>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteItem(selectedItem.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Barang
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
