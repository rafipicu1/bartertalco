import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  MapPin, 
  Tag, 
  DollarSign, 
  Calendar,
  User,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';

interface Item {
  id: string;
  name: string;
  description: string;
  detailed_minus: string;
  photos: string[];
  estimated_value: number;
  top_up_value: number | null;
  category: string;
  condition: string;
  location: string;
  province: string | null;
  city: string | null;
  district: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
  barter_preference: string;
  profiles?: {
    username: string;
    full_name?: string;
  };
}

interface ItemDetailDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleActive?: (itemId: string, currentStatus: boolean) => void;
}

const categoryLabels: Record<string, string> = {
  elektronik: 'Elektronik',
  fashion: 'Fashion',
  kendaraan: 'Kendaraan',
  properti: 'Properti',
  hobi_koleksi: 'Hobi & Koleksi',
  olahraga: 'Olahraga',
  musik: 'Musik',
  gaming: 'Gaming',
  makanan_minuman: 'Makanan & Minuman',
  kesehatan_kecantikan: 'Kesehatan & Kecantikan',
  perlengkapan_rumah: 'Perlengkapan Rumah',
  mainan_anak: 'Mainan Anak',
  kantor_industri: 'Kantor & Industri',
  other: 'Lainnya',
};

const conditionLabels: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti Baru',
  good: 'Bagus',
  fair: 'Cukup',
  worn: 'Bekas Pakai',
};

export function ItemDetailDialog({ item, open, onOpenChange, onToggleActive }: ItemDetailDialogProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detail Barang
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap barang
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Gallery */}
          <div className="relative">
            <div className="aspect-square rounded-lg bg-muted overflow-hidden">
              <img
                src={item.photos[currentPhotoIndex] || '/placeholder.svg'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            {item.photos.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                {item.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                      idx === currentPhotoIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            {/* Status Badge */}
            <Badge
              className={`absolute top-2 right-2 ${
                item.is_active ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              {item.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>

          {/* Title & Price */}
          <div>
            <h3 className="text-xl font-bold">{item.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xl font-bold text-primary">
                {formatPrice(item.estimated_value)}
              </span>
              {item.top_up_value && item.top_up_value > 0 && (
                <Badge variant="outline" className="text-green-600">
                  +{formatPrice(item.top_up_value)} top up
                </Badge>
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Pemilik</p>
              <p className="text-sm text-primary">@{item.profiles?.username}</p>
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Kategori</span>
              </div>
              <Badge variant="secondary">
                {categoryLabels[item.category] || item.category}
              </Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Kondisi</span>
              </div>
              <Badge variant="secondary">
                {conditionLabels[item.condition] || item.condition}
              </Badge>
            </div>
          </div>

          {/* Location */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Lokasi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {item.district && `${item.district}, `}
              {item.city && `${item.city}, `}
              {item.province || item.location}
            </p>
          </div>

          {/* Description */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Deskripsi</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>

          {/* Minus/Defects */}
          {item.detailed_minus && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Kekurangan</span>
              </div>
              <p className="text-sm text-yellow-600">{item.detailed_minus}</p>
            </div>
          )}

          {/* Barter Preference */}
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Preferensi Barter</span>
            </div>
            <p className="text-sm text-muted-foreground">{item.barter_preference}</p>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Diposting {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: id })}
            </span>
          </div>

          {/* Actions */}
          {onToggleActive && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant={item.is_active ? 'destructive' : 'default'}
                className="flex-1"
                onClick={() => {
                  onToggleActive(item.id, item.is_active);
                  onOpenChange(false);
                }}
              >
                {item.is_active ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Nonaktifkan
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aktifkan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
