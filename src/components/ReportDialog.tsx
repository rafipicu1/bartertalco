import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

type ReportType = 'user' | 'item' | 'conversation';
type ReportReason = 'scam' | 'fake_item' | 'inappropriate_behavior' | 'spam' | 'other';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  reportedUserId?: string;
  reportedItemId?: string;
  reportedConversationId?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'scam', label: 'Penipuan', description: 'Pengguna mencoba menipu atau berbohong' },
  { value: 'fake_item', label: 'Barang Palsu', description: 'Barang tidak sesuai deskripsi atau palsu' },
  { value: 'inappropriate_behavior', label: 'Perilaku Tidak Pantas', description: 'Perilaku kasar, melecehkan, atau tidak sopan' },
  { value: 'spam', label: 'Spam', description: 'Pesan atau konten spam' },
  { value: 'other', label: 'Lainnya', description: 'Alasan lain yang perlu dilaporkan' },
];

export function ReportDialog({
  isOpen,
  onClose,
  reportType,
  reportedUserId,
  reportedItemId,
  reportedConversationId,
}: ReportDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getReportTypeLabel = () => {
    switch (reportType) {
      case 'user': return 'Pengguna';
      case 'item': return 'Barang';
      case 'conversation': return 'Percakapan';
    }
  };

  const handleSubmit = async () => {
    if (!user || !reason) {
      toast.error('Pilih alasan laporan');
      return;
    }

    if (reason === 'other' && !description.trim()) {
      toast.error('Jelaskan alasan laporan kamu');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          report_type: reportType,
          reported_user_id: reportedUserId || null,
          reported_item_id: reportedItemId || null,
          reported_conversation_id: reportedConversationId || null,
          reason: reason,
          description: description.trim() || null,
        });

      if (error) throw error;

      toast.success('Laporan berhasil dikirim');
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Gagal mengirim laporan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Laporkan {getReportTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Laporkan jika kamu menemukan sesuatu yang tidak pantas. Tim kami akan meninjau laporan ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Alasan Laporan</Label>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              {REPORT_REASONS.map((r) => (
                <div
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reason === r.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setReason(r.value)}
                >
                  <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                  <div>
                    <Label htmlFor={r.value} className="cursor-pointer font-medium">
                      {r.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Detail Tambahan {reason !== 'other' && '(Opsional)'}
            </Label>
            <Textarea
              id="description"
              placeholder="Jelaskan lebih detail tentang laporan kamu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim Laporan'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
