import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, LogOut, Plus, Edit, MapPin, Camera, Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LocationSelector } from '@/components/LocationSelector';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
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
    loadItems();
  }, [user]);

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
    }
  };

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

  const handleToggleItemStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
      
      toast.success(currentStatus ? 'Barang dinonaktifkan' : 'Barang diaktifkan');
      loadItems();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      toast.success('Barang berhasil dihapus');
      loadItems();
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
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-full md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Profil Saya</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-full text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold">{profile?.username}</h2>
                    {profile?.verified && (
                      <Badge className="bg-accent text-accent-foreground">Verified</Badge>
                    )}
                  </div>
                  {profile?.full_name && (
                    <p className="text-muted-foreground mb-1">{profile.full_name}</p>
                  )}
                  {profile?.location && (
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.bio && (
                    <p className="text-sm mb-3">{profile.bio}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Barang Saya ({items.length})</h3>
            <Button
              onClick={() => navigate('/upload')}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>

          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Belum ada barang</h3>
                <p className="text-muted-foreground mb-4 text-sm">Mulai upload barang pertamamu!</p>
                <Button onClick={() => navigate('/upload')}>
                  Upload Barang
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={item.photos[0] || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {!item.is_active && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="secondary">Nonaktif</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm mb-1 truncate">{item.name}</h4>
                    <p className="text-sm font-bold text-primary mb-2">
                      {formatPrice(item.estimated_value)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => handleToggleItemStatus(item.id, item.is_active)}
                      >
                        {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8 w-8 p-0"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
