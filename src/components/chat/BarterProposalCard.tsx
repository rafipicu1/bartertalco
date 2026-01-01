import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, ArrowRightLeft } from 'lucide-react';
import { formatLocationDisplay } from '@/data/indonesiaLocations';

interface BarterProposalCardProps {
  item: {
    id: string;
    name: string;
    photos: string[];
    condition: string;
    city?: string | null;
    district?: string | null;
    location?: string;
    estimated_value: number;
  };
  isOwn?: boolean;
  onViewDetail?: (itemId: string) => void;
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti Baru',
  good: 'Baik',
  fair: 'Cukup Baik',
  worn: 'Bekas Pakai',
};

export function BarterProposalCard({ item, isOwn = false, onViewDetail }: BarterProposalCardProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const locationText = formatLocationDisplay(item.city, item.district) || item.location || '';

  return (
    <Card className={`overflow-hidden border-2 ${
      isOwn ? 'border-primary/30 bg-primary/5' : 'border-secondary/30 bg-secondary/5'
    }`}>
      {/* Header */}
      <div className={`px-3 py-2 flex items-center gap-2 ${
        isOwn ? 'bg-primary/10' : 'bg-secondary/10'
      }`}>
        <ArrowRightLeft className={`h-4 w-4 ${isOwn ? 'text-primary' : 'text-secondary'}`} />
        <span className="text-xs font-semibold">
          {isOwn ? 'Barang yang kamu tawarkan' : 'Barang yang ditawarkan'}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex gap-3">
        {/* Image */}
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          <img
            src={item.photos[0] || '/placeholder.svg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
          
          {locationText && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{locationText}</span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] py-0 h-5">
              {CONDITION_LABELS[item.condition] || item.condition}
            </Badge>
            <span className="text-xs font-bold text-primary">
              {formatPrice(item.estimated_value)}
            </span>
          </div>
        </div>
      </div>

      {/* Action */}
      {onViewDetail && (
        <div className="px-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8"
            onClick={() => onViewDetail(item.id)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Lihat Detail Barang
          </Button>
        </div>
      )}
    </Card>
  );
}
