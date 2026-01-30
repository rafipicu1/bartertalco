import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationSelector } from '@/components/LocationSelector';
import { toast } from 'sonner';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin and redirect appropriately
  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      if (user) {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          navigate('/admin');
        } else {
          navigate('/swipe');
        }
      }
    };
    
    checkAdminAndRedirect();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username || !province || !city || !district) {
          toast.error('Username dan lokasi lengkap harus diisi');
          setLoading(false);
          return;
        }
        
        const location = `${city} — ${district}`;
        const { error } = await signUp(email, password, { 
          username, 
          location,
          full_name: fullName,
          province,
          city,
          district,
        });
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Akun berhasil dibuat! Selamat datang di BARTR! 🎉');
          // Redirect will be handled by useEffect
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Selamat datang kembali! 🎉');
          // Redirect will be handled by useEffect after user state updates
        }
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-rainbow flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 animate-bounce-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center animate-glow">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BARTR
          </CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? 'Bergabung dengan revolusi barter' : 'Selamat datang kembali di BARTR'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="pengguna123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={isSignUp}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap (opsional)</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                
                {/* Location Selector */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <LocationSelector
                    province={province}
                    city={city}
                    district={district}
                    onProvinceChange={setProvince}
                    onCityChange={setCity}
                    onDistrictChange={setDistrict}
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-12 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  {isSignUp ? 'Buat Akun' : 'Masuk'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
