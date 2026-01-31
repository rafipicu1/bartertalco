import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Heart, X, ThumbsUp, Navigation } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, formatDistance } from '@/lib/geolocation';

interface SwipeCardProps {
  item: {
    id: string;
    name: string;
    photos: string[];
    estimated_value: number;
    category: string;
    condition: string;
    location: string;
    city?: string | null;
    district?: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  style?: any;
  isLiked?: boolean;
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti Baru',
  good: 'Baik',
  fair: 'Cukup Baik',
  worn: 'Bekas Pakai',
};

export function SwipeCard({ item, onSwipe, style, isLiked = false }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0);
  const [distance, setDistance] = useState<string | null>(null);
  const { user } = useAuth();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    const getDistance = async () => {
      if (user && item.latitude && item.longitude) {
        const { data } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single();
        
        if (data?.latitude && data?.longitude) {
          const dist = calculateDistance(
            data.latitude,
            data.longitude,
            item.latitude,
            item.longitude
          );
          setDistance(formatDistance(dist));
        }
      }
    };
    
    getDistance();
  }, [user, item]);

  const handleDragEnd = (event: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 300 : -300);
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    } else if (info.offset.y < -100) {
      onSwipe('up');
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        ...style,
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute w-full max-w-full overflow-hidden"
    >
      <Card className="overflow-hidden shadow-2xl border-2 border-border/50 bg-card cursor-grab active:cursor-grabbing max-w-full">
        <div className="relative h-[420px] sm:h-[480px]">
          <img
            src={item.photos[0] || '/placeholder.svg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {/* Liked badge */}
          {isLiked && (
            <Badge className="absolute top-4 left-4 bg-yellow-500/90 text-white flex items-center gap-1 text-sm px-3 py-1">
              <Heart className="h-4 w-4 fill-white" />
              Menunggu Balasan
            </Badge>
          )}
          
          {/* Swipe indicators */}
          <motion.div
            className="absolute top-10 left-6 bg-accent text-accent-foreground px-6 py-3 rounded-2xl font-bold text-2xl rotate-[-15deg] border-4 border-accent shadow-lg"
            style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
          >
            👍 SUKA
          </motion.div>
          <motion.div
            className="absolute top-10 right-6 bg-destructive text-destructive-foreground px-6 py-3 rounded-2xl font-bold text-2xl rotate-[15deg] border-4 border-destructive shadow-lg"
            style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
          >
            👎 SKIP
          </motion.div>
          
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1 drop-shadow-lg">{item.name}</h3>
                <div className="flex items-center gap-1 text-sm opacity-90">
                  <MapPin className="h-4 w-4" />
                  <span>{item.city || item.location}</span>
                  {distance && (
                    <>
                      <span className="mx-1">•</span>
                      <Navigation className="h-3 w-3" />
                      <span>{distance}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground text-base font-semibold px-3 py-1.5 shadow-lg">
                {formatPrice(item.estimated_value)}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs bg-background/30 text-white border-white/50">
                {CONDITION_LABELS[item.condition] || item.condition}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action buttons - simplified */}
        <div className="p-4 bg-gradient-to-b from-card to-muted/20">
          <div className="flex justify-center items-center gap-8">
            <button
              onClick={() => onSwipe('left')}
              className="w-16 h-16 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
            >
              <X className="h-8 w-8 text-destructive" />
            </button>
            <button
              onClick={() => onSwipe('up')}
              className="w-20 h-20 rounded-full bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-secondary/30 shadow-md"
            >
              <Heart className="h-10 w-10 text-secondary fill-secondary" />
            </button>
            <button
              onClick={() => onSwipe('right')}
              className="w-16 h-16 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
            >
              <ThumbsUp className="h-8 w-8 text-accent" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
