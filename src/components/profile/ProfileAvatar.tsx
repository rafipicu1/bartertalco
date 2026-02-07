import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { SubscriptionTier } from '@/hooks/useSubscription';

interface ProfileAvatarProps {
  profile: any;
  userId: string;
  tier: SubscriptionTier;
  onUpdate: () => void;
}

export function ProfileAvatar({ profile, userId, tier, onUpdate }: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

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
        .eq('id', userId);
      if (updateError) throw updateError;

      toast.success('Foto profil berhasil diperbarui');
      onUpdate();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Gagal mengupload foto');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {profile?.profile_photo_url ? (
          <img
            src={profile.profile_photo_url}
            alt={profile?.username}
            className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-lg"
          />
        ) : (
          <div className="w-28 h-28 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground text-4xl font-bold border-4 border-background shadow-lg">
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
          disabled={uploading}
          className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <h2 className="text-xl font-bold">{profile?.username}</h2>
        <SubscriptionBadge tier={tier} />
      </div>
      {profile?.full_name && (
        <p className="text-muted-foreground text-sm">{profile.full_name}</p>
      )}
    </div>
  );
}
