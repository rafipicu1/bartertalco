import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Sparkles, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { loadSnapScript, openSnapPayment, resetSnapState } from '@/lib/midtrans';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'swipe' | 'proposal' | 'upload' | 'wishlist' | 'general';
  currentCount?: number;
  maxCount?: number;
}

const plans = [
  {
    id: 'plus_monthly',
    name: 'Plus',
    tier: 'plus',
    price: 29000,
    period: 'bulan',
    badge: 'Populer',
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Swipe unlimited',
      '5 item aktif',
      'Proposal barter unlimited',
      'Wishlist unlimited',
      'Lihat 100 item/hari',
      'Boost item',
      'Prioritas di beranda & swipe',
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    tier: 'pro',
    price: 79000,
    period: 'bulan',
    badge: 'Best Value',
    color: 'from-purple-500 to-pink-500',
    features: [
      'Swipe unlimited',
      'Item aktif unlimited',
      'Proposal barter unlimited',
      'Wishlist unlimited',
      'Lihat item unlimited',
      'Boost item',
      'Prioritas tertinggi di beranda',
      'Insight analytics',
    ],
  },
];

const limitMessages: Record<string, { title: string; message: string }> = {
  swipe: {
    title: 'Swipe Habis! 😢',
    message: 'Swipe kamu hari ini sudah habis. Upgrade untuk swipe unlimited!',
  },
  proposal: {
    title: 'Barter Proposal Habis!',
    message: 'Kamu sudah mencapai limit barter proposal hari ini.',
  },
  upload: {
    title: 'Limit Item Tercapai! 📦',
    message: 'Kamu sudah mencapai batas item aktif. Pilih upgrade atau bayar per posting!',
  },
  wishlist: {
    title: 'Wishlist Penuh!',
    message: 'Wishlist kamu sudah penuh. Upgrade untuk menyimpan lebih banyak!',
  },
  general: {
    title: 'Upgrade ke Premium',
    message: 'Nikmati fitur premium untuk pengalaman barter yang lebih baik!',
  },
};

export function UpgradeModal({
  open,
  onOpenChange,
  limitType,
  currentCount,
  maxCount,
}: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  // Reset snap state when modal opens or closes
  useEffect(() => {
    // Always reset snap state when modal state changes
    resetSnapState();
  }, [open]);

  const handleUpgrade = async (productType: string) => {
    // Prevent double clicks
    if (loading) {
      return;
    }
    
    setLoading(productType);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Silakan login terlebih dahulu');
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
          onOpenChange(false);
          window.location.reload();
        },
        onPending: (result: any) => {
          console.log('Payment pending:', result);
          toast.info('Menunggu pembayaran...');
          onOpenChange(false);
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

  const handleSinglePost = async () => {
    await handleUpgrade('single_post');
  };

  const message = limitMessages[limitType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-yellow-500" />
            {message.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {message.message}
            {currentCount !== undefined && maxCount !== undefined && (
              <span className="block mt-1 font-medium text-foreground">
                {currentCount}/{maxCount} sudah digunakan
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${
                plan.tier === 'pro' ? 'border-primary/30 bg-primary/5' : 'border-border'
              }`}
            >
              {plan.badge && (
                <Badge
                  className={`absolute -top-2 right-4 bg-gradient-to-r ${plan.color} text-white border-0`}
                >
                  {plan.badge}
                </Badge>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {plan.tier === 'pro' ? (
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  ) : (
                    <Zap className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="font-bold text-lg">Bartr {plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">
                    Rp{plan.price.toLocaleString('id-ID')}
                  </span>
                  <span className="text-sm text-muted-foreground">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading !== null}
              >
                {loading === plan.id ? 'Memproses...' : `Upgrade ke ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>

        {limitType === 'upload' && (
          <div className="border-t pt-4 mt-2">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-sm font-medium mb-2">
                💡 Mau posting 1 barang aja?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Bayar sekali pakai Rp3.000 untuk upload 1 item tambahan tanpa perlu upgrade.
              </p>
              <Button
                variant="outline"
                className="w-full border-green-500/50 hover:bg-green-500/10"
                onClick={handleSinglePost}
                disabled={loading !== null}
              >
                {loading === 'single_post' ? 'Memproses...' : 'Bayar Rp3.000 (1x Posting)'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {limitType === 'swipe' ? 'Coba Besok' : 'Nanti Saja'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
