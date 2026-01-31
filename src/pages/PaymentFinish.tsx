import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Home, MessageCircle } from "lucide-react";

export default function PaymentFinish() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'success' | 'pending' | 'failed' | 'loading'>('loading');

  // Midtrans redirect parameters
  const orderId = searchParams.get('order_id');
  const statusCode = searchParams.get('status_code');
  const transactionStatus = searchParams.get('transaction_status');

  useEffect(() => {
    // Determine payment status from Midtrans parameters
    if (statusCode === '200' || transactionStatus === 'capture' || transactionStatus === 'settlement') {
      setStatus('success');
    } else if (transactionStatus === 'pending') {
      setStatus('pending');
    } else if (statusCode === '201') {
      setStatus('pending');
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      setStatus('failed');
    } else {
      // Default to success if no clear status (user might have just closed the popup)
      setStatus('success');
    }
  }, [statusCode, transactionStatus]);

  const statusConfig = {
    loading: {
      icon: <Clock className="h-16 w-16 text-muted-foreground animate-pulse" />,
      title: "Memproses...",
      description: "Mohon tunggu sebentar",
      color: "text-muted-foreground",
    },
    success: {
      icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
      title: "Pembayaran Berhasil! 🎉",
      description: "Terima kasih! Pembayaran kamu sudah kami terima dan fitur premium sudah aktif.",
      color: "text-green-500",
    },
    pending: {
      icon: <Clock className="h-16 w-16 text-amber-500" />,
      title: "Menunggu Pembayaran",
      description: "Silakan selesaikan pembayaran kamu. Status akan diperbarui otomatis setelah pembayaran dikonfirmasi.",
      color: "text-amber-500",
    },
    failed: {
      icon: <XCircle className="h-16 w-16 text-red-500" />,
      title: "Pembayaran Gagal",
      description: "Maaf, pembayaran kamu tidak berhasil. Silakan coba lagi atau gunakan metode pembayaran lain.",
      color: "text-red-500",
    },
  };

  const config = statusConfig[status];

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {config.icon}
            </div>

            {/* Status Message */}
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${config.color}`}>
                {config.title}
              </h1>
              <p className="text-muted-foreground text-sm px-4">
                {config.description}
              </p>
            </div>

            {/* Order ID */}
            {orderId && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm font-medium">{orderId}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
              
              {status === 'success' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/profile')}
                >
                  Lihat Status Langganan
                </Button>
              )}

              {status === 'failed' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/pricing')}
                >
                  Coba Lagi
                </Button>
              )}

              {status === 'pending' && (
                <p className="text-xs text-muted-foreground">
                  Kamu akan menerima notifikasi setelah pembayaran dikonfirmasi
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
