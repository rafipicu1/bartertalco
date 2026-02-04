import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, User, MapPin, Flag, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { BarterProposalCard } from "@/components/chat/BarterProposalCard";
import { ItemProposalSelector } from "@/components/chat/ItemProposalSelector";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { MobileLayout } from "@/components/MobileLayout";
import { PageHeader } from "@/components/PageHeader";
import { ReportDialog } from "@/components/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  message_type: string;
  item_id: string | null;
  item?: {
    id: string;
    name: string;
    photos: string[];
    condition: string;
    city: string | null;
    district: string | null;
    location: string;
    estimated_value: number;
  };
}

interface ConversationData {
  id: string;
  user1_id: string;
  user2_id: string;
  item1_id: string | null;
  item2_id: string | null;
  other_user?: {
    username: string;
    profile_photo_url: string | null;
  };
  target_item?: {
    id: string;
    name: string;
    photos: string[];
    estimated_value: number;
    condition: string;
    location: string;
  };
  my_item?: {
    id: string;
    name: string;
    photos: string[];
    estimated_value: number;
    condition: string;
    location: string;
  };
}

export default function ChatDetail() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get initial item data from navigation state
  const initialTargetItem = location.state?.targetItem;
  const initialMyItem = location.state?.myItem;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user || !conversationId) {
      navigate('/auth');
      return;
    }

    fetchConversation();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          let messageWithItem = payload.new as Message;
          if (messageWithItem.item_id) {
            const { data: item } = await supabase
              .from('items')
              .select('id, name, photos, condition, city, district, location, estimated_value')
              .eq('id', messageWithItem.item_id)
              .single();
            messageWithItem.item = item || undefined;
          }
          setMessages(prev => [...prev, messageWithItem]);
          scrollToBottom();
          
          if (payload.new.sender_id !== user.id) {
            markAsRead(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      const otherUserId = data.user1_id === user.id ? data.user2_id : data.user1_id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, profile_photo_url')
        .eq('id', otherUserId)
        .single();

      // Fetch items if they exist
      let targetItem = initialTargetItem;
      let myItem = initialMyItem;

      if (data.item1_id && !targetItem) {
        const { data: item1 } = await supabase
          .from('items')
          .select('id, name, photos, estimated_value, condition, location')
          .eq('id', data.item1_id)
          .single();
        if (item1) {
          // Determine which item belongs to which user
          const item1Owner = await supabase
            .from('items')
            .select('user_id')
            .eq('id', data.item1_id)
            .single();
          
          if (item1Owner.data?.user_id === user.id) {
            myItem = item1;
          } else {
            targetItem = item1;
          }
        }
      }

      if (data.item2_id && !myItem) {
        const { data: item2 } = await supabase
          .from('items')
          .select('id, name, photos, estimated_value, condition, location')
          .eq('id', data.item2_id)
          .single();
        if (item2) {
          const item2Owner = await supabase
            .from('items')
            .select('user_id')
            .eq('id', data.item2_id)
            .single();
          
          if (item2Owner.data?.user_id === user.id) {
            myItem = item2;
          } else {
            targetItem = item2;
          }
        }
      }

      setConversation({
        ...data,
        other_user: profile,
        target_item: targetItem,
        my_item: myItem,
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Gagal memuat percakapan');
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const messagesWithItems = await Promise.all(
        (data || []).map(async (msg) => {
          if (msg.item_id) {
            const { data: item } = await supabase
              .from('items')
              .select('id, name, photos, condition, city, district, location, estimated_value')
              .eq('id', msg.item_id)
              .single();
            return { ...msg, item };
          }
          return msg;
        })
      );
      
      setMessages(messagesWithItems);

      const unreadMessages = (data || []).filter(
        msg => !msg.read && msg.sender_id !== user?.id
      );
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessages.map(m => m.id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text',
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const sendBarterProposal = async (item: any) => {
    if (!user || !conversationId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `Hai! Aku mau tukar barangmu dengan barangku ini 👇`,
          message_type: 'barter_proposal',
          item_id: item.id,
        });

      if (error) throw error;
      toast.success('Penawaran barter terkirim! 🎉');
    } catch (error) {
      console.error('Error sending barter proposal:', error);
      toast.error('Gagal mengirim penawaran');
    } finally {
      setSending(false);
    }
  };

  const handleViewItemDetail = async (itemId: string) => {
    try {
      const { data } = await supabase
        .from('items')
        .select(`
          *,
          profiles (
            username,
            profile_photo_url,
            latitude,
            longitude
          )
        `)
        .eq('id', itemId)
        .single();
      
      if (data) {
        setSelectedItemForDetail(data);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <MobileLayout showBottomNav={false}>
        <PageHeader title="Chat" onBack={() => navigate('/chat')} />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-background flex flex-col overflow-x-hidden max-w-full">
        <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/chat')} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9">
                {conversation?.other_user?.profile_photo_url ? (
                  <img
                    src={conversation.other_user.profile_photo_url}
                    alt={conversation.other_user.username}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </Avatar>
              <h1 className="text-base font-bold truncate">
                {conversation?.other_user?.username || 'User'}
              </h1>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Laporkan Percakapan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl space-y-4">
            {/* Show item cards at the start of conversation */}
            {messages.length === 0 && (conversation?.target_item || initialTargetItem) && (
              <div className="space-y-3 mb-6">
                <p className="text-center text-sm text-muted-foreground">
                  Memulai percakapan tentang barter
                </p>
                
                {/* Target item (other user's item) */}
                {(conversation?.target_item || initialTargetItem) && (
                  <Card className="p-3 bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">Barang yang diminati</Badge>
                    </div>
                    <div className="flex gap-3">
                      <img
                        src={(conversation?.target_item || initialTargetItem)?.photos[0]}
                        alt={(conversation?.target_item || initialTargetItem)?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {(conversation?.target_item || initialTargetItem)?.name}
                        </h4>
                        <p className="text-primary font-bold text-sm">
                          {formatPrice((conversation?.target_item || initialTargetItem)?.estimated_value)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{(conversation?.target_item || initialTargetItem)?.location}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* My item (proposed for barter) */}
                {(conversation?.my_item || initialMyItem) && (
                  <Card className="p-3 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-xs bg-primary">Barang penawaranmu</Badge>
                    </div>
                    <div className="flex gap-3">
                      <img
                        src={(conversation?.my_item || initialMyItem)?.photos[0]}
                        alt={(conversation?.my_item || initialMyItem)?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {(conversation?.my_item || initialMyItem)?.name}
                        </h4>
                        <p className="text-primary font-bold text-sm">
                          {formatPrice((conversation?.my_item || initialMyItem)?.estimated_value)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{(conversation?.my_item || initialMyItem)?.location}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const isBarterProposal = message.message_type === 'barter_proposal';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {isBarterProposal && message.item ? (
                    <div className={`max-w-[85%] sm:max-w-[70%] space-y-2`}>
                      <Card
                        className={`${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card'
                        }`}
                      >
                        <div className="p-3">
                          <p className="text-sm break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </p>
                        </div>
                      </Card>
                      <BarterProposalCard
                        item={message.item}
                        isOwn={isOwn}
                        onViewDetail={handleViewItemDetail}
                      />
                    </div>
                  ) : (
                    <Card
                      className={`max-w-[70%] ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card'
                      }`}
                    >
                      <div className="p-3">
                        <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="border-t bg-card p-4">
          <form onSubmit={sendMessage} className="container mx-auto max-w-4xl flex gap-2">
            <ItemProposalSelector onSelectItem={sendBarterProposal} />
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1"
              disabled={sending}
            />
            <Button type="submit" disabled={!newMessage.trim() || sending}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </footer>

        {selectedItemForDetail && (
          <ItemDetailModal
            item={selectedItemForDetail}
            isOpen={!!selectedItemForDetail}
            onClose={() => setSelectedItemForDetail(null)}
          />
        )}

        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          reportType="conversation"
          reportedConversationId={conversationId}
          reportedUserId={conversation?.user1_id === user?.id ? conversation?.user2_id : conversation?.user1_id}
        />
      </div>
    </MobileLayout>
  );
}
