import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Edit, MapPin, Camera, Save, Shield, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { PageHeader } from '@/components/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LocationSelector } from '@/components/LocationSelector';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tier, limits, usage, subscription } = useSubscription();
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    province: '',
    city: '',
    district: '',
  });

  useEffect(() => {
    loadProfile();
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditForm({
        username: data?.username || '',
        full_name: data?.full_name || '',
        bio: data?.bio || '',
        province: data?.province || '',
        city: data?.city || '',
        district: data?.district || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Berhasil keluar');
    navigate('/auth');
  };

  const handleSaveProfile = async () => {
    try {
      const location = editForm.city && editForm.district 
        ? `${editForm.city} — ${editForm.district}` 
        : editForm.city || '';

      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          full_name: editForm.full_name,
          bio: editForm.bio,
          province: editForm.province,
          city: editForm.city,
          district: editForm.district,
          location,
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profil berhasil diperbarui');
      setEditingProfile(false);
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui profil');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrlData.publicUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      toast.success('Foto profil berhasil diperbarui');
      loadProfile();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Gagal mengupload foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
          title="Profil Saya" 
          onBack={() => navigate('/')}
          rightContent={
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          }
        />

        <main className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  {profile?.profile_photo_url ? (
                    <img 
                      src={profile.profile_photo_url} 
                      alt={profile?.username}
                      className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold border-4 border-background shadow-lg">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Name & Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{profile?.username}</h2>
                  <SubscriptionBadge tier={tier} />
                  {profile?.verified && (
                    <Badge className="bg-accent text-accent-foreground">Verified</Badge>
                  )}
                </div>
                
                {profile?.full_name && (
                  <p className="text-muted-foreground text-sm mb-1">{profile.full_name}</p>
                )}
                
                {profile?.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile?.bio && (
                  <p className="text-sm mb-4 max-w-xs">{profile.bio}</p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profil
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')} className="gap-2">
                    <Crown className="h-4 w-4" />
                    {tier === 'free' ? 'Upgrade' : 'Kelola Plan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          {tier !== 'free' && subscription?.expires_at && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Aktif</p>
                    <p className="font-bold">Bartr {tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Berakhir</p>
                    <p className="font-medium">
                      {new Date(subscription.expires_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Stats */}
          <Card className="border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">Penggunaan Hari Ini</p>
                {tier === 'free' && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
                    Upgrade
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {usage.swipe_count}/{limits.daily_swipes + (subscription?.extra_swipe_slots || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Swipe</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {usage.proposal_count}/{limits.daily_proposals + (subscription?.extra_proposal_slots || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Proposal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {usage.items_viewed || 0}/{limits.daily_views}
                  </p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Informasi Akun</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bergabung</span>
                  <span className="font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Edit Profile Dialog */}
        <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nama Lengkap</label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Ceritakan tentang dirimu..."
                  rows={3}
                />
              </div>
              <LocationSelector
                province={editForm.province}
                city={editForm.city}
                district={editForm.district}
                onProvinceChange={(v) => setEditForm({ ...editForm, province: v, city: '', district: '' })}
                onCityChange={(v) => setEditForm({ ...editForm, city: v, district: '' })}
                onDistrictChange={(v) => setEditForm({ ...editForm, district: v })}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingProfile(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
