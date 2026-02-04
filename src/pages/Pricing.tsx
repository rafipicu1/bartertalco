import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Sparkles, Package, MessageCircle } from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { PageHeader } from '@/components/PageHeader';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { loadSnapScript, openSnapPayment, resetSnapState } from '@/lib/midtrans';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: null,
    description: 'Untuk pengguna casual',
    features: [
      { label: 'Swipe 20x per hari', included: true },
      { label: '1 item aktif', included: true },
      { label: '5 proposal barter/hari', included: true },
      { label: '10 wishlist', included: true },
      { label: 'Lihat 30 item/hari', included: true },
      { label: 'Boost item', included: false },
      { label: 'Prioritas di beranda', included: false },
      { label: 'Insight analytics', included: false },
    ],
  },
  {
    id: 'plus_monthly',
    name: 'Plus',
    price: 29000,
    period: 'bulan',
    badge: 'Populer',
    description: 'Untuk power user',
    color: 'from-blue-500 to-cyan-500',
    features: [
      { label: 'Swipe unlimited', included: true },
      { label: '5 item aktif', included: true },
      { label: 'Proposal barter unlimited', included: true },
      { label: 'Wishlist unlimited', included: true },
      { label: 'Lihat 100 item/hari', included: true },
      { label: 'Boost item', included: true },
      { label: 'Prioritas di beranda & swipe', included: true },
      { label: 'Insight analytics', included: false },
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 79000,
    period: 'bulan',
    badge: 'Best Value',
    description: 'Untuk seller & kolektor',
    color: 'from-purple-500 to-pink-500',
    features: [
      { label: 'Swipe unlimited', included: true },
      { label: 'Item aktif unlimited', included: true },
      { label: 'Proposal barter unlimited', included: true },
      { label: 'Wishlist unlimited', included: true },
      { label: 'Lihat item unlimited', included: true },
      { label: 'Boost item', included: true },
      { label: 'Prioritas tertinggi di beranda', included: true },
      { label: 'Insight analytics', included: true },
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tier } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  
  const limitType = searchParams.get('limit');

  // Reset snap state when leaving the page
  useEffect(() => {
    return () => {
      resetSnapState();
    };
  }, []);

  const handleSubscribe = async (productType: string) => {
    if (productType === 'free') return;

    // Prevent double clicks
    if (loading) {
      return;
    }

    setLoading(productType);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Silakan login terlebih dahulu');
        navigate('/auth');
        setLoading(null);
        return;
      }

      const response = await supabase.functions.invoke('midtrans-payment/create-transaction', {
        body: { product_type: productType },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { snap_token, client_key, is_production } = response.data;

      // Load Midtrans Snap
      await loadSnapScript(client_key, is_production);

      // Open payment popup (will auto-hide existing popup first)
      openSnapPayment(snap_token, {
        onSuccess: (result: any) => {
          console.log('Payment success:', result);
          toast.success('Pembayaran berhasil! 🎉');
          window.location.reload();
        },
        onPending: (result: any) => {
          console.log('Payment pending:', result);
          toast.info('Menunggu pembayaran...');
        },
        onError: (result: any) => {
          console.error('Payment error:', result);
          toast.error('Pembayaran gagal');
          setLoading(null);
        },
        onClose: () => {
          console.log('Payment popup closed');
          setLoading(null);
        },
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Terjadi kesalahan');
      setLoading(null);
    }
  };

  return (
    <MobileLayout>
      <PageHeader 
        title="Upgrade Plan" 
        icon={<Crown className="h-5 w-5 text-yellow-500" />}
      />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Limit Message Banner */}
        {(limitType === 'swipe' || limitType === 'proposal') && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-center">
            {limitType === 'swipe' ? (
              <>
                <h2 className="text-xl font-bold text-destructive mb-2">😔 Jatah Swipe-mu Habis!</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade untuk swipe unlimited, atau coba lagi besok.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full mb-2"
                  onClick={() => navigate('/')}
                >
                  Coba Besok
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-destructive mb-2">😔 Jatah Mengajukanmu Habis!</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade untuk unlimited proposal, atau beli 1 chat tambahan.
                </p>
              </>
            )}
          </div>
        )}

        <div className="text-center mb-8">
          {limitType === 'upload' ? (
            <>
              <h2 className="text-2xl font-bold mb-2">Limit Item Tercapai! 📦</h2>
              <p className="text-muted-foreground">
                Kamu sudah mencapai batas item aktif. Upgrade atau bayar per posting!
              </p>
            </>
          ) : limitType === 'swipe' || limitType === 'proposal' ? (
            <>
              <h2 className="text-2xl font-bold mb-2">Upgrade Sekarang?</h2>
              <p className="text-muted-foreground">
                Pilih plan untuk akses unlimited
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Pilih Plan Kamu</h2>
              <p className="text-muted-foreground">
                Upgrade untuk fitur unlimited dan prioritas
              </p>
            </>
          )}
        </div>

        <div className="space-y-4">
          {plans.map((plan) => {
            const isCurrentPlan = 
              (tier === 'free' && plan.id === 'free') ||
              (tier === 'plus' && plan.id.startsWith('plus')) ||
              (tier === 'pro' && plan.id.startsWith('pro'));

            return (
              <Card
                key={plan.id}
                className={`p-5 relative transition-all ${
                  plan.color ? 'border-2 border-primary/30' : ''
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.badge && (
                  <Badge
                    className={`absolute -top-2 right-4 bg-gradient-to-r ${plan.color} text-white border-0`}
                  >
                    {plan.badge}
                  </Badge>
                )}

                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-4 bg-green-500 text-white border-0">
                    Plan Aktif
                  </Badge>
                )}

                <div className="flex items-center gap-3 mb-4">
                  {plan.id === 'free' ? (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ) : plan.id.startsWith('plus') ? (
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">Bartr {plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="ml-auto text-right">
                    {plan.price > 0 ? (
                      <>
                        <p className="text-xl font-bold">
                          Rp{plan.price.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">/{plan.period}</p>
                      </>
                    ) : (
                      <p className="text-xl font-bold">Gratis</p>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 flex-shrink-0 ${
                        feature.included ? 'text-green-500' : 'text-muted-foreground/30'
                      }`} />
                      <span className={feature.included ? '' : 'text-muted-foreground/50 line-through'}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.price > 0 && !isCurrentPlan && (
                  <Button
                    className={`w-full ${plan.color ? `bg-gradient-to-r ${plan.color} text-white hover:opacity-90` : ''}`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading !== null}
                  >
                    {loading === plan.id ? 'Memproses...' : `Pilih ${plan.name}`}
                  </Button>
                )}

                {isCurrentPlan && plan.price > 0 && (
                  <Button className="w-full" disabled>
                    Plan Aktif
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {/* Single Post Payment Option */}
        <Card className="mt-6 p-5 bg-accent/5 border-accent/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg">💡 Mau posting 1 barang aja?</h3>
              <p className="text-sm text-muted-foreground">Tanpa perlu upgrade bulanan</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-bold">Rp3.000</p>
              <p className="text-xs text-muted-foreground">sekali bayar</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Bayar sekali pakai untuk upload 1 item tambahan tanpa perlu berlangganan.
          </p>
          
          <Button
            variant="outline"
            className="w-full border-accent/50 hover:bg-accent/10"
            onClick={() => handleSubscribe('single_post')}
            disabled={loading !== null}
          >
            {loading === 'single_post' ? 'Memproses...' : 'Bayar Rp3.000 (1x Posting)'}
          </Button>
        </Card>

        {/* Single Chat Payment Option - Only show when proposal limit reached */}
        {limitType === 'proposal' && (
          <Card className="mt-4 p-5 bg-secondary/5 border-secondary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">💬 Butuh 1 chat aja?</h3>
                <p className="text-sm text-muted-foreground">Beli satuan tanpa upgrade</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold">Rp1.000</p>
                <p className="text-xs text-muted-foreground">per chat</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Beli 1 kesempatan chat untuk mengajukan barter ke pemilik barang.
            </p>
            
            <Button
              variant="outline"
              className="w-full border-secondary/50 hover:bg-secondary/10"
              onClick={() => handleSubscribe('single_chat')}
              disabled={loading !== null}
            >
              {loading === 'single_chat' ? 'Memproses...' : 'Bayar Rp1.000 (1x Chat)'}
            </Button>
          </Card>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">💳 Metode Pembayaran</h4>
          <p className="text-sm text-muted-foreground">
            QRIS, GoPay, OVO, ShopeePay, Transfer Bank, Kartu Kredit
          </p>
        </div>
      </main>
    </MobileLayout>
  );
}
