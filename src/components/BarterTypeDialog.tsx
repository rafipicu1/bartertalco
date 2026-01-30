import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowRightLeft, Plus, Minus, ArrowRight, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BarterTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'barter' | 'tuker_tambah', topUpAmount: number, topUpDirection: 'pay' | 'receive') => void;
  myItem: {
    id: string;
    name: string;
    photos: string[];
    estimated_value: number;
  };
  targetItem: {
    id: string;
    name: string;
    photos: string[];
    estimated_value: number;
  };
}

export function BarterTypeDialog({ isOpen, onClose, onConfirm, myItem, targetItem }: BarterTypeDialogProps) {
  const [selectedType, setSelectedType] = useState<'barter' | 'tuker_tambah' | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [topUpDirection, setTopUpDirection] = useState<'pay' | 'receive'>('pay');

  const valueDifference = targetItem.estimated_value - myItem.estimated_value;
  const suggestedTopUp = Math.abs(valueDifference);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleConfirm = () => {
    if (selectedType === 'barter') {
      onConfirm('barter', 0, 'pay');
    } else if (selectedType === 'tuker_tambah') {
      onConfirm('tuker_tambah', topUpAmount, topUpDirection);
    }
    resetState();
  };

  const resetState = () => {
    setSelectedType(null);
    setTopUpAmount(0);
    setTopUpDirection('pay');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Jenis Penawaran</DialogTitle>
          <DialogDescription>
            Bagaimana kamu mau menukar barang ini?
          </DialogDescription>
        </DialogHeader>

        {/* Items comparison */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-muted mb-1">
              {myItem.photos[0] ? (
                <img src={myItem.photos[0]} alt={myItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs font-medium truncate">{myItem.name}</p>
            <p className="text-xs text-primary">{formatPrice(myItem.estimated_value)}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-muted mb-1">
              {targetItem.photos[0] ? (
                <img src={targetItem.photos[0]} alt={targetItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs font-medium truncate">{targetItem.name}</p>
            <p className="text-xs text-primary">{formatPrice(targetItem.estimated_value)}</p>
          </div>
        </div>

        {/* Value difference info */}
        {valueDifference !== 0 && (
          <div className={`text-center text-sm p-2 rounded-lg ${valueDifference > 0 ? 'bg-yellow-500/10 text-yellow-700' : 'bg-green-500/10 text-green-700'}`}>
            {valueDifference > 0 
              ? `Barang tujuan lebih mahal ${formatPrice(suggestedTopUp)}`
              : `Barang kamu lebih mahal ${formatPrice(suggestedTopUp)}`
            }
          </div>
        )}

        {/* Type selection */}
        {!selectedType && (
          <div className="space-y-3">
            <Card 
              className="p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedType('barter')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Barter Langsung</h4>
                  <p className="text-xs text-muted-foreground">Tukar barang tanpa tambahan uang</p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover:border-secondary transition-colors"
              onClick={() => {
                setSelectedType('tuker_tambah');
                // Pre-fill with suggested amount
                if (valueDifference > 0) {
                  setTopUpAmount(suggestedTopUp);
                  setTopUpDirection('pay');
                } else if (valueDifference < 0) {
                  setTopUpAmount(suggestedTopUp);
                  setTopUpDirection('receive');
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Tuker Tambah</h4>
                  <p className="text-xs text-muted-foreground">Tukar dengan tambahan uang</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tuker tambah options */}
        {selectedType === 'tuker_tambah' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={topUpDirection === 'pay' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTopUpDirection('pay')}
              >
                <Minus className="mr-2 h-4 w-4" />
                Saya Tambah
              </Button>
              <Button
                variant={topUpDirection === 'receive' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTopUpDirection('receive')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Minta Tambahan
              </Button>
            </div>

            <div className="space-y-2">
              <Label>
                {topUpDirection === 'pay' 
                  ? 'Berapa uang yang kamu tambahkan?' 
                  : 'Berapa uang tambahan yang kamu minta?'
                }
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                <Input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
              {suggestedTopUp > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selisih harga: {formatPrice(suggestedTopUp)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedType(null)}>
                Kembali
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={topUpAmount <= 0}>
                Lanjutkan
              </Button>
            </div>
          </div>
        )}

        {/* Barter confirmation */}
        {selectedType === 'barter' && (
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-lg text-center">
              <p className="text-sm">Kamu akan menawarkan barter langsung tanpa tambahan uang.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedType(null)}>
                Kembali
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                Kirim Penawaran
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
