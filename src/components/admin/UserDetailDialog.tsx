import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  Crown, 
  AlertTriangle,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  profile_photo_url: string | null;
  location: string;
  created_at: string;
  verified: boolean;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  bio?: string | null;
}

interface UserDetailDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserDetails {
  user: {
    id: string;
    email: string;
    phone: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
  };
  profile: UserProfile;
  subscription: {
    tier: string;
    status: string;
    expires_at: string | null;
  } | null;
  items_count: number;
  active_bans: Array<{
    ban_type: string;
    reason: string;
    expires_at: string | null;
  }>;
}

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchUserDetails();
    }
  }, [open, user]);

  const fetchUserDetails = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('seed-test-users', {
        body: { action: 'get_user_details', user_id: user.id },
      });

      if (response.error) throw response.error;
      setDetails(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-purple-500 text-white">PRO</Badge>;
      case 'plus':
        return <Badge className="bg-blue-500 text-white">PLUS</Badge>;
      default:
        return <Badge variant="secondary">FREE</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detail Pengguna
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap pengguna @{user?.username}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {details.profile?.profile_photo_url ? (
                  <img
                    src={details.profile.profile_photo_url}
                    alt={details.profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">@{details.profile?.username}</h3>
                  {details.profile?.verified && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-muted-foreground">{details.profile?.full_name}</p>
                {details.subscription && getTierBadge(details.subscription.tier)}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Kontak</h4>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{details.user.email || 'Tidak ada'}</p>
                </div>
                {details.user.email_confirmed_at ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telepon</p>
                  <p className="text-sm text-muted-foreground">{details.user.phone || 'Tidak ada'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Lokasi</p>
                  <p className="text-sm text-muted-foreground">
                    {details.profile?.district && `${details.profile.district}, `}
                    {details.profile?.city && `${details.profile.city}, `}
                    {details.profile?.province || details.profile?.location || 'Tidak ada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{details.items_count}</p>
                <p className="text-xs text-muted-foreground">Barang</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Crown className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-lg font-bold">{details.subscription?.tier?.toUpperCase() || 'FREE'}</p>
                <p className="text-xs text-muted-foreground">Tier</p>
              </div>
            </div>

            {/* Subscription */}
            {details.subscription && details.subscription.tier !== 'free' && (
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status Langganan</span>
                  <Badge variant={details.subscription.status === 'active' ? 'default' : 'secondary'}>
                    {details.subscription.status}
                  </Badge>
                </div>
                {details.subscription.expires_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Berakhir: {new Date(details.subscription.expires_at).toLocaleDateString('id-ID')}
                  </p>
                )}
              </div>
            )}

            {/* Active Bans */}
            {details.active_bans && details.active_bans.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-700">Ban Aktif</span>
                </div>
                {details.active_bans.map((ban, idx) => (
                  <div key={idx} className="text-sm text-red-600">
                    <p className="font-medium">{ban.ban_type}</p>
                    <p>{ban.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Bergabung {formatDistanceToNow(new Date(details.user.created_at), { addSuffix: true, locale: id })}</span>
              </div>
              {details.user.last_sign_in_at && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Terakhir login {formatDistanceToNow(new Date(details.user.last_sign_in_at), { addSuffix: true, locale: id })}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {details.profile?.bio && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Bio</p>
                <p className="text-sm text-muted-foreground">{details.profile.bio}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Gagal memuat data pengguna
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
