import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { BarterProposalCard } from "@/components/chat/BarterProposalCard";
import { ItemProposalSelector } from "@/components/chat/ItemProposalSelector";
import { ItemDetailModal } from "@/components/ItemDetailModal";

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
  other_user?: {
    username: string;
    profile_photo_url: string | null;
  };
}

export default function ChatDetail() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          // Fetch item data if it's a barter proposal
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
          
          // Mark as read if from other user
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

      setConversation({
        ...data,
        other_user: profile,
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
      
      // Fetch item data for barter proposals
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

      // Mark unread messages as read
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            {conversation?.other_user?.profile_photo_url ? (
              <img
                src={conversation.other_user.profile_photo_url}
                alt={conversation.other_user.username}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </Avatar>
          <h1 className="text-xl font-bold">
            {conversation?.other_user?.username || 'User'}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
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
    </div>
  );
}
