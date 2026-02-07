import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, User, FileText, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LocationSelector } from '@/components/LocationSelector';

interface ProfileInfoSectionProps {
  profile: any;
  userId: string;
  onUpdate: () => void;
}

export function ProfileInfoSection({ profile, userId, onUpdate }: ProfileInfoSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    province: '',
    city: '',
    district: '',
  });

  const startEditing = () => {
    setForm({
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      province: profile?.province || '',
      city: profile?.city || '',
      district: profile?.district || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      toast.error('Username tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      const location = form.city && form.district
        ? `${form.city} — ${form.district}`
        : form.city || '';

      const { error } = await supabase
        .from('profiles')
        .update({
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          bio: form.bio.trim(),
          province: form.province,
          city: form.city,
          district: form.district,
          location,
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Profil berhasil diperbarui');
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Edit Informasi Profil
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Username</label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Lengkap</label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Ceritakan tentang dirimu..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio.length}/200</p>
            </div>
            <LocationSelector
              province={form.province}
              city={form.city}
              district={form.district}
              onProvinceChange={(v) => setForm({ ...form, province: v, city: '', district: '' })}
              onCityChange={(v) => setForm({ ...form, city: v, district: '' })}
              onDistrictChange={(v) => setForm({ ...form, district: v })}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Informasi Profil
          </h3>
          <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1.5 text-primary">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>

        <div className="space-y-3">
          <InfoRow label="Username" value={profile?.username} />
          <InfoRow label="Nama Lengkap" value={profile?.full_name} placeholder="Belum diisi" />
          <InfoRow
            label="Bio"
            value={profile?.bio}
            placeholder="Belum diisi"
            icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
          />
          <InfoRow
            label="Lokasi"
            value={profile?.location}
            placeholder="Belum diatur"
            icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  placeholder = '-',
  icon,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-medium text-right max-w-[60%] ${!value ? 'text-muted-foreground/50 italic' : ''}`}>
        {value || placeholder}
      </span>
    </div>
  );
}
