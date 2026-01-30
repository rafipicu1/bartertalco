import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Sparkles, ArrowLeft } from 'lucide-react';
import { MobileLayout } from '@/components/MobileLayout';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { loadSnapScript, openSnapPayment, isSnapPopupOpen, resetSnapState } from '@/lib/midtrans';

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
      { label: '3 barter proposal/hari', included: true },
      { label: '10 wishlist', included: true },
      { label: 'Boost item', included: false },
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
      { label: 'Barter proposal unlimited', included: true },
      { label: 'Wishlist unlimited', included: true },
      { label: 'Boost item', included: true },
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
      { label: 'Semua fitur Plus', included: true },
      { label: 'Upload item unlimited', included: true },
      { label: 'Prioritas homepage', included: true },
      { label: 'Item insights', included: true },
      { label: 'Badge PRO', included: true },
      { label: 'Support prioritas', included: true },
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  // Reset snap state when leaving the page
  useEffect(() => {
    return () => {
      resetSnapState();
    };
  }, []);

  const handleSubscribe = async (productType: string) => {
    if (productType === 'free') return;

    // Prevent double clicks
    if (loading || isSnapPopupOpen()) {
      return;
    }

    setLoading(productType);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Silakan login terlebih dahulu');
        navigate('/auth');
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

      // Open payment popup
      const opened = openSnapPayment(snap_token, {
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
        },
        onClose: () => {
          console.log('Payment popup closed');
        },
      });
      
      if (!opened) {
        toast.error('Popup pembayaran sedang terbuka');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(null);
    }
  };

  return (
    <MobileLayout>
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <h1 className="text-xl font-bold">Upgrade Plan</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Pilih Plan Kamu</h2>
          <p className="text-muted-foreground">
            Upgrade untuk fitur unlimited dan prioritas
          </p>
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
