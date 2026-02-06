import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationSelector } from '@/components/LocationSelector';
import { toast } from 'sonner';
import { Upload as UploadIcon, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { MobileLayout } from '@/components/MobileLayout';
import { PageHeader } from '@/components/PageHeader';

const CATEGORIES = [
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'kendaraan', label: 'Kendaraan' },
  { value: 'properti', label: 'Properti' },
  { value: 'hobi_koleksi', label: 'Hobi & Koleksi' },
  { value: 'olahraga', label: 'Olahraga' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'musik', label: 'Musik' },
  { value: 'buku', label: 'Buku' },
  { value: 'makanan_minuman', label: 'Makanan & Minuman' },
  { value: 'kesehatan_kecantikan', label: 'Kesehatan & Kecantikan' },
  { value: 'perlengkapan_rumah', label: 'Perlengkapan Rumah' },
  { value: 'mainan_anak', label: 'Mainan Anak' },
  { value: 'kantor_industri', label: 'Kantor & Industri' },
];

const CONDITIONS = [
  { value: 'new', label: 'Baru' },
  { value: 'like_new', label: 'Seperti Baru' },
  { value: 'good', label: 'Baik' },
  { value: 'fair', label: 'Cukup Baik' },
  { value: 'worn', label: 'Bekas Pakai' },
];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  
  const { limits, canUploadItem, consumeExtraPostSlot, subscription } = useSubscription();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailed_minus: '',
    category: '',
    estimated_value: '',
    barter_preference: '',
    top_up_value: '',
    condition: '',
    province: '',
    city: '',
    district: '',
  });

  // Check upload limit on mount
  useEffect(() => {
    if (user) {
      loadUserLocation();
      checkUploadLimit();
    }
  }, [user]);

  const checkUploadLimit = async () => {
    if (!user) return;
    
    const canUpload = await canUploadItem();
    
    // Get current item count
    const { data } = await supabase
      .from('items')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (!canUpload) {
      // Redirect to pricing page with limit info
      navigate('/pricing?limit=upload');
    }
  };

  const loadUserLocation = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('province, city, district')
        .eq('id', user.id)
        .single();

      if (data) {
        setFormData(prev => ({
          ...prev,
          province: data.province || '',
          city: data.city || '',
          district: data.district || '',
        }));
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      toast.error('Maksimal 10 foto');
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user!.id}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('item-photos')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('item-photos')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (photos.length < 3) {
      toast.error('Minimal 3 foto diperlukan');
      return;
    }

    if (!formData.province || !formData.city || !formData.district) {
      toast.error('Lokasi lengkap harus diisi');
      return;
    }

    setLoading(true);

    try {
      // Upload photos
      const photoUrls = await uploadPhotos();
      
      const location = `${formData.city} — ${formData.district}`;

      // Create item
      const { error } = await supabase.from('items').insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        detailed_minus: formData.detailed_minus,
        photos: photoUrls,
        category: formData.category as any,
        estimated_value: parseFloat(formData.estimated_value),
        barter_preference: formData.barter_preference,
        top_up_value: formData.top_up_value ? parseFloat(formData.top_up_value) : 0,
        condition: formData.condition as any,
        location: location,
        province: formData.province,
        city: formData.city,
        district: formData.district,
      });

      if (error) throw error;

      // Check if user needed to use an extra slot (over base limit)
      const { data: itemCount } = await supabase
        .from('items')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      const currentCount = itemCount?.length || 0;
      if (currentCount > limits.active_items && (subscription?.extra_post_slots || 0) > 0) {
        // Consume one extra slot
        await consumeExtraPostSlot();
      }

      toast.success('Barang berhasil diupload! 🎉');
      navigate('/katalog');
    } catch (error: any) {
      console.error('Error uploading item:', error);
      toast.error(error.message || 'Gagal mengupload barang');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-muted">
        <PageHeader title="Pasang Barang" />

        <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Pasang Barang Anda</CardTitle>
            <CardDescription>Isi detail barang untuk ditukar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photos */}
              <div className="space-y-2">
                <Label>Foto (min 3, maks 10)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <label className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                      <div className="text-center">
                        <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Tambah Foto</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Barang</Label>
                <Input
                  id="name"
                  placeholder="Contoh: iPhone 14 Pro Max"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan kondisi dan keunggulan barang..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailed_minus">Kekurangan / Minus Barang</Label>
                <Textarea
                  id="detailed_minus"
                  value={formData.detailed_minus}
                  onChange={(e) => setFormData({ ...formData, detailed_minus: e.target.value })}
                  placeholder="Jelaskan kekurangan, cacat, atau minus barang..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kondisi</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kondisi" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {CONDITIONS.map((cond) => (
                        <SelectItem key={cond.value} value={cond.value}>
                          {cond.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_value">Estimasi Nilai (Rupiah)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    placeholder="5000000"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="top_up_value">Nilai Top-up (opsional)</Label>
                  <Input
                    id="top_up_value"
                    type="number"
                    placeholder="0"
                    value={formData.top_up_value}
                    onChange={(e) => setFormData({ ...formData, top_up_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barter_preference">Mau Tukar Apa?</Label>
                <Input
                  id="barter_preference"
                  value={formData.barter_preference}
                  onChange={(e) => setFormData({ ...formData, barter_preference: e.target.value })}
                  placeholder="Contoh: Laptop gaming, Kamera mirrorless, dll"
                  required
                />
              </div>

              {/* Location Selector */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <LocationSelector
                  province={formData.province}
                  city={formData.city}
                  district={formData.district}
                  onProvinceChange={(value) => setFormData({ ...formData, province: value })}
                  onCityChange={(value) => setFormData({ ...formData, city: value })}
                  onDistrictChange={(value) => setFormData({ ...formData, district: value })}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary text-white h-12 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  'Pasang Barang'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </main>
      </div>
    </MobileLayout>
  );
}
