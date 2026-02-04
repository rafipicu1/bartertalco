import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { PageHeader } from '@/components/PageHeader';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          items (
            *,
            profiles:user_id (
              username,
              location
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      setWishlistItems(wishlistItems.filter(item => item.id !== wishlistId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <MobileLayout>
        <PageHeader title="Wishlist" />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-muted">
        <PageHeader title="Wishlist" icon={<Heart className="h-5 w-5" />} />

        <main className="container mx-auto px-4 py-6 max-w-4xl">
        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No items in wishlist</h3>
              <p className="text-muted-foreground mb-6">
                Swipe up on items you like to add them to your wishlist!
              </p>
              <Button
                onClick={() => navigate('/swipe')}
                className="bg-gradient-primary text-white"
              >
                Start Swiping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((wishlistItem) => {
              const item = wishlistItem.items;
              return (
                <Card key={wishlistItem.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative">
                    <img
                      src={item.photos[0] || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1 truncate">{item.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-primary text-primary-foreground">
                        {formatPrice(item.estimated_value)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.condition}
                      </Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => removeFromWishlist(wishlistItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </MobileLayout>
  );
}
