import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Plus, AlertCircle, Check, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  photos: string[];
  estimated_value: number;
  condition: string;
  location: string;
}

interface SmartBarterProposalProps {
  myItem: Item;
  targetItem: Item;
  onConfirm: (topUpAmount: number) => void;
  onCancel: () => void;
}

export function SmartBarterProposal({
  myItem,
  targetItem,
  onConfirm,
  onCancel,
}: SmartBarterProposalProps) {
  const valueDifference = targetItem.estimated_value - myItem.estimated_value;
  const needsTopUp = valueDifference > 0;
  const [showTopUpInput, setShowTopUpInput] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(valueDifference > 0 ? valueDifference : 0);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleProceedWithBarter = () => {
    onConfirm(0);
  };

  const handleProceedWithTopUp = () => {
    if (showTopUpInput) {
      onConfirm(topUpAmount);
    } else {
      setShowTopUpInput(true);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-background to-muted/30 border-2">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-primary">
          <ArrowRightLeft className="h-5 w-5" />
          <span className="font-semibold">Perbandingan Nilai Barter</span>
        </div>

        {/* Items Comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* My Item */}
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">Barangmu</Badge>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={myItem.photos[0] || '/placeholder.svg'}
                alt={myItem.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-medium line-clamp-1">{myItem.name}</p>
            <p className="text-primary font-bold">{formatPrice(myItem.estimated_value)}</p>
          </div>

          {/* Target Item */}
          <div className="space-y-2">
            <Badge className="text-xs bg-secondary">Barang Tujuan</Badge>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={targetItem.photos[0] || '/placeholder.svg'}
                alt={targetItem.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-medium line-clamp-1">{targetItem.name}</p>
            <p className="text-primary font-bold">{formatPrice(targetItem.estimated_value)}</p>
          </div>
        </div>

        {/* Value Difference Alert */}
        {needsTopUp ? (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Nilai barangmu lebih rendah
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Selisih: <span className="font-bold">{formatPrice(valueDifference)}</span>
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Apakah kamu ingin tetap barter atau melakukan tukar tambah?
                </p>
              </div>
            </div>
          </div>
        ) : valueDifference < 0 ? (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Nilai barangmu lebih tinggi! 🎉
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Selisih: <span className="font-bold">{formatPrice(Math.abs(valueDifference))}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Nilai barang seimbang! ✨
              </p>
            </div>
          </div>
        )}

        {/* Top Up Input */}
        {showTopUpInput && needsTopUp && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium">Jumlah Tukar Tambah</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rp</span>
              <Input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                min={0}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Rekomendasi: {formatPrice(valueDifference)} untuk nilai yang seimbang
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <X className="h-4 w-4 mr-1" />
            Batal
          </Button>
          
          {needsTopUp ? (
            <>
              <Button
                variant="secondary"
                onClick={handleProceedWithBarter}
                className="flex-1"
              >
                Tetap Barter
              </Button>
              <Button onClick={handleProceedWithTopUp} className="flex-1">
                <Plus className="h-4 w-4 mr-1" />
                {showTopUpInput ? 'Konfirmasi' : 'Tukar Tambah'}
              </Button>
            </>
          ) : (
            <Button onClick={() => onConfirm(0)} className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              Lanjutkan Barter
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
