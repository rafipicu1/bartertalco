import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MapPin, TrendingUp, User, MessageCircle, ArrowUpDown, Navigation, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance, formatDistance } from "@/lib/geolocation";
import { toast } from "sonner";
import { ItemSelectionDialog } from "@/components/ItemSelectionDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { BarterTypeDialog } from "@/components/BarterTypeDialog";

interface ItemDetailModalProps {
  item: {
    id: string;
    user_id: string;
    name: string;
    description: string;
    detailed_minus: string;
    photos: string[];
    category: string;
    estimated_value: number;
    barter_preference: string;
    top_up_value: number;
    condition: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    profiles: {
      username: string;
      profile_photo_url: string | null;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti Baru',
  good: 'Baik',
  fair: 'Cukup Baik',
  worn: 'Bekas Pakai',
};

export const ItemDetailModal = ({ item, isOpen, onClose }: ItemDetailModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [distance, setDistance] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBarterTypeDialog, setShowBarterTypeDialog] = useState(false);
  const [selectedUserItem, setSelectedUserItem] = useState<any>(null);

  useEffect(() => {
    const getDistance = async () => {
      if (user && item.latitude && item.longitude) {
        const { data } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single();
        
        if (data?.latitude && data?.longitude) {
          const dist = calculateDistance(
            data.latitude,
            data.longitude,
            item.latitude,
            item.longitude
          );
          setDistance(formatDistance(dist));
        }
      }
    };
    
    if (isOpen) {
      getDistance();
    }
  }, [isOpen, user, item]);

  const handleContact = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowItemSelection(true);
  };

  const handleItemSelected = async (selectedItemId: string, selectedItemName: string, selectedItemValue: number, selectedItem: any) => {
    // Store the selected item and show barter type dialog
    setSelectedUserItem({
      id: selectedItemId,
      name: selectedItemName,
      estimated_value: selectedItemValue,
      photos: selectedItem.photos,
      ...selectedItem
    });
    setShowItemSelection(false);
    setShowBarterTypeDialog(true);
  };

  const handleBarterTypeConfirm = async (type: 'barter' | 'tuker_tambah', topUpAmount: number, topUpDirection: 'pay' | 'receive') => {
    if (!selectedUserItem) return;
    
    setContacting(true);
    setShowBarterTypeDialog(false);
    
    try {
      // Check if conversation already exists
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user!.id},user2_id.eq.${item.user_id}),and(user1_id.eq.${item.user_id},user2_id.eq.${user!.id})`)
        .maybeSingle();

      let conversationId = existingConvo?.id;

      if (!existingConvo) {
        // Create new conversation with item references
        const { data: newConvo, error } = await supabase
          .from('conversations')
          .insert({
            user1_id: user!.id < item.user_id ? user!.id : item.user_id,
            user2_id: user!.id < item.user_id ? item.user_id : user!.id,
            item1_id: user!.id < item.user_id ? selectedUserItem.id : item.id,
            item2_id: user!.id < item.user_id ? item.id : selectedUserItem.id,
          })
          .select()
          .single();

        if (error) throw error;
        conversationId = newConvo.id;
      }

      // Build message based on type
      let initialMessage: string;
      
      if (type === 'barter') {
        initialMessage = `Halo! 👋

Saya tertarik dengan *${item.name}* kamu (${formatPrice(item.estimated_value)}).

Saya ingin mengajak kamu **barter langsung** dengan *${selectedUserItem.name}* saya (${formatPrice(selectedUserItem.estimated_value)}).

Apakah barang ini masih tersedia? Bisa COD kan?`;
      } else {
        // Tuker tambah
        if (topUpDirection === 'pay') {
          initialMessage = `Halo! 👋

Saya tertarik dengan *${item.name}* kamu (${formatPrice(item.estimated_value)}).

Saya ingin **tuker tambah** dengan *${selectedUserItem.name}* saya (${formatPrice(selectedUserItem.estimated_value)}) + uang ${formatPrice(topUpAmount)}.

Apakah barang ini masih tersedia? Gimana menurutmu?`;
        } else {
          initialMessage = `Halo! 👋

Saya tertarik dengan *${item.name}* kamu (${formatPrice(item.estimated_value)}).

Saya ingin **tuker tambah** dengan *${selectedUserItem.name}* saya (${formatPrice(selectedUserItem.estimated_value)}). Karena barang saya lebih mahal, saya minta tambahan ${formatPrice(topUpAmount)} dari kamu.

Apakah kamu tertarik? Bisa nego kok! 😊`;
        }
      }

      // Send initial message with barter proposal
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content: initialMessage,
          message_type: 'barter_proposal',
          item_id: selectedUserItem.id,
        });

      // Navigate with item data
      navigate(`/chat/${conversationId}`, {
        state: {
          targetItem: item,
          myItem: selectedUserItem,
        }
      });
      onClose();
      setSelectedUserItem(null);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Gagal membuka chat');
    } finally {
      setContacting(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Photos */}
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {item.photos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={photo}
                        alt={`${item.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {item.photos.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">{item.category}</Badge>
              <Badge variant="outline">{CONDITION_LABELS[item.condition] || item.condition}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Estimasi Nilai</p>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(item.estimated_value)}
              </p>
              {item.top_up_value > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  + Top up: {formatPrice(item.top_up_value)}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Mau ditukar dengan
              </p>
              <p className="font-medium">{item.barter_preference}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Deskripsi</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-destructive">Kekurangan / Minus</h3>
              <p className="text-sm text-muted-foreground">{item.detailed_minus}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
              <MapPin className="h-4 w-4" />
              <span>{item.location}</span>
              {distance && (
                <>
                  <span className="mx-1">•</span>
                  <Navigation className="h-4 w-4" />
                  <span>{distance}</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{item.profiles?.username || 'User'}</span>
              </div>
              {user && user.id !== item.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Laporkan
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={() => navigate('/swipe')}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Mulai Swipe
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={handleContact}
                disabled={contacting || user?.id === item.user_id}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {contacting ? 'Membuka...' : 'Hubungi'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ItemSelectionDialog
      isOpen={showItemSelection}
      onClose={() => setShowItemSelection(false)}
      onItemSelected={handleItemSelected}
      targetItem={item}
    />

    {selectedUserItem && (
      <BarterTypeDialog
        isOpen={showBarterTypeDialog}
        onClose={() => {
          setShowBarterTypeDialog(false);
          setSelectedUserItem(null);
        }}
        onConfirm={handleBarterTypeConfirm}
        myItem={selectedUserItem}
        targetItem={{
          id: item.id,
          name: item.name,
          photos: item.photos,
          estimated_value: item.estimated_value,
        }}
      />
    )}

    <ReportDialog
      isOpen={showReportDialog}
      onClose={() => setShowReportDialog(false)}
      reportType="item"
      reportedItemId={item.id}
      reportedUserId={item.user_id}
    />
    </>
  );
};
