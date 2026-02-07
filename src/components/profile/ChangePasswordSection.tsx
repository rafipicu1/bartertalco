import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal 6 karakter').max(72, 'Password maksimal 72 karakter'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const handleSave = async () => {
    setErrors({});
    const result = passwordSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: form.newPassword,
      });

      if (error) throw error;
      toast.success('Password berhasil diperbarui');
      setForm({ newPassword: '', confirmPassword: '' });
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Keamanan</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-primary">
              <KeyRound className="h-3.5 w-3.5" />
              Ganti Password
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Pastikan akun kamu menggunakan password yang kuat dan unik.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Ganti Password</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Password Baru</label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
                className={errors.newPassword ? 'border-destructive' : ''}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-destructive mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Konfirmasi Password</label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setOpen(false);
              setForm({ newPassword: '', confirmPassword: '' });
              setErrors({});
            }}
            disabled={saving}
          >
            Batal
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
