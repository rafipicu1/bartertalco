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
import { toast } from 'sonner';
import { ArrowLeft, Upload as UploadIcon, X, MapPin } from 'lucide-react';
import { getCurrentLocation } from '@/lib/geolocation';

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailed_minus: '',
    category: '',
    estimated_value: '',
    barter_preference: '',
    top_up_value: '',
    condition: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    // Get current location on component mount
    getCurrentLocation()
      .then((coords) => {
        setFormData((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        toast.success('Lokasi Anda terdeteksi! 📍');
      })
      .catch(() => {
        toast.error('Tidak dapat mendeteksi lokasi Anda');
      });
  }, []);

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

    setLoading(true);

    try {
      // Upload photos
      const photoUrls = await uploadPhotos();

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
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });

      if (error) throw error;

      toast.success('Barang berhasil diupload! 🎉');
      navigate('/profile');
    } catch (error: any) {
      console.error('Error uploading item:', error);
      toast.error(error.message || 'Gagal mengupload barang');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Pasang Barang</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
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
                    <SelectContent>
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
                    <SelectContent>
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

              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Jakarta, Indonesia"
                    required
                  />
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-muted-foreground">
                    📍 Koordinat terdeteksi: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
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
  );
}
