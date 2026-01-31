import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FrequentlyWishlistedItems } from "@/components/FrequentlyWishlistedItems";

interface UserItem {
  id: string;
  name: string;
  estimated_value: number;
  photos: string[];
  category: string;
  condition?: string;
  location?: string;
  city?: string | null;
  district?: string | null;
}

interface ItemSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelected: (itemId: string, itemName: string, itemValue: number, item: UserItem) => void;
  targetItem: {
    name: string;
    estimated_value: number;
  };
}

export const ItemSelectionDialog = ({ isOpen, onClose, onItemSelected, targetItem }: ItemSelectionDialogProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserItems = async () => {
      if (!user || !isOpen) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('items')
          .select('id, name, estimated_value, photos, category, condition, location, city, district')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserItems();
  }, [user, isOpen]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateTopUp = (userItemValue: number) => {
    const difference = targetItem.estimated_value - userItemValue;
    return difference;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Pilih Barang untuk Tukar</DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Pilih barang kamu yang mau ditukar dengan <span className="font-semibold line-clamp-1">{targetItem.name}</span>
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Kamu belum punya barang untuk ditukar</p>
            <Button className="mt-4" onClick={() => window.location.href = '/upload'}>
              Upload Barang
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Frequently Wishlisted Items Section - shown when target is more expensive */}
            <FrequentlyWishlistedItems 
              targetItemValue={targetItem.estimated_value}
              onItemSelected={onItemSelected}
            />

            {/* User's all items */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Semua Barangmu</span>
              </div>
              <div className="grid gap-2 sm:gap-3">
                {items.map((item) => {
                  const topUp = calculateTopUp(item.estimated_value);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                      onClick={() => onItemSelected(item.id, item.name, item.estimated_value, item)}
                    >
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.photos[0] ? (
                          <img
                            src={item.photos[0]}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1">{item.name}</h3>
                        <Badge variant="outline" className="text-[10px] mb-1">{item.category}</Badge>
                        <p className="text-xs sm:text-sm font-medium text-primary">
                          {formatPrice(item.estimated_value)}
                        </p>
                        {topUp !== 0 && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            {topUp > 0 
                              ? `+ Tambah ${formatPrice(topUp)}`
                              : `Lebih mahal ${formatPrice(Math.abs(topUp))}`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
