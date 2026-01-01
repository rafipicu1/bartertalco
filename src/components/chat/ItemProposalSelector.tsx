import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatLocationDisplay } from '@/data/indonesiaLocations';

interface UserItem {
  id: string;
  name: string;
  photos: string[];
  condition: string;
  city: string | null;
  district: string | null;
  location: string;
  estimated_value: number;
}

interface ItemProposalSelectorProps {
  onSelectItem: (item: UserItem) => void;
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti Baru',
  good: 'Baik',
  fair: 'Cukup Baik',
  worn: 'Bekas Pakai',
};

export function ItemProposalSelector({ onSelectItem }: ItemProposalSelectorProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserItems();
    }
  }, [open, user]);

  const fetchUserItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, photos, condition, city, district, location, estimated_value')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching user items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: UserItem) => {
    onSelectItem(item);
    setOpen(false);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 hover:border-primary"
        >
          <Package className="h-5 w-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Ajukan Barter
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">
            Pilih barang yang ingin kamu tawarkan untuk barter:
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Kamu belum punya barang untuk ditawarkan
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const locationText = formatLocationDisplay(item.city, item.district) || item.location;
                
                return (
                  <Card
                    key={item.id}
                    className="p-3 cursor-pointer hover:border-primary transition-all hover:shadow-md"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.photos[0] || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                        {locationText && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{locationText}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] py-0">
                            {CONDITION_LABELS[item.condition] || item.condition}
                          </Badge>
                          <span className="text-xs font-bold text-primary">
                            {formatPrice(item.estimated_value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
