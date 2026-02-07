import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Heart, X, ThumbsUp, Navigation, User } from 'lucide-react';
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
    profiles?: {
      username: string;
      profile_photo_url?: string | null;
      location?: string;
    };
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
      className="w-full h-full overflow-hidden"
    >
      <Card className="overflow-hidden shadow-2xl border-2 border-border/50 bg-card cursor-grab active:cursor-grabbing max-w-full h-full flex flex-col">
        <div className="relative flex-1 min-h-0">
          <img
            src={item.photos[0] || '/placeholder.svg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {isLiked && (
            <Badge className="absolute top-4 left-4 bg-secondary/90 text-secondary-foreground flex items-center gap-1 text-xs px-3 py-1">
              <Heart className="h-3.5 w-3.5 fill-current" />
              Menunggu Balasan
            </Badge>
          )}
          
          {/* Swipe indicators - outline icons only */}
          <motion.div
            className="absolute top-10 left-6 bg-accent text-accent-foreground px-5 py-2.5 rounded-2xl font-bold text-xl rotate-[-15deg] border-4 border-accent shadow-lg flex items-center gap-2"
            style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
          >
            <ThumbsUp className="h-6 w-6" />
            SUKA
          </motion.div>
          <motion.div
            className="absolute top-10 right-6 bg-destructive text-destructive-foreground px-5 py-2.5 rounded-2xl font-bold text-xl rotate-[15deg] border-4 border-destructive shadow-lg flex items-center gap-2"
            style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
          >
            <X className="h-6 w-6" />
            SKIP
          </motion.div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 drop-shadow-lg">{item.name}</h3>
                <div className="flex items-center gap-1 text-sm opacity-90">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{item.city || item.location}</span>
                  {distance && (
                    <>
                      <span className="mx-1 opacity-50">·</span>
                      <Navigation className="h-3 w-3" />
                      <span>{distance}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1.5 shadow-lg">
                {formatPrice(item.estimated_value)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs bg-background/20 text-white border-white/30">
                {CONDITION_LABELS[item.condition] || item.condition}
              </Badge>
              {item.profiles && (
                <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full">
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                    {item.profiles.profile_photo_url ? (
                      <img 
                        src={item.profiles.profile_photo_url} 
                        alt={item.profiles.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <User className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">@{item.profiles.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-3 bg-card">
          <div className="flex justify-center items-center gap-6">
            <button
              onClick={() => onSwipe('left')}
              className="w-14 h-14 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
            >
              <X className="h-7 w-7 text-destructive" />
            </button>
            <button
              onClick={() => onSwipe('up')}
              className="w-16 h-16 rounded-full bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-secondary/30 shadow-sm"
            >
              <Heart className="h-8 w-8 text-secondary" />
            </button>
            <button
              onClick={() => onSwipe('right')}
              className="w-14 h-14 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
            >
              <ThumbsUp className="h-7 w-7 text-accent-foreground" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
