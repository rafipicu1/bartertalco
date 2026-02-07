import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, User, MapPin, Flag, MoreVertical, ImagePlus, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { BarterProposalCard } from "@/components/chat/BarterProposalCard";
import { ItemProposalSelector } from "@/components/chat/ItemProposalSelector";
import { ItemDetailModal } from "@/components/ItemDetailModal";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

      let targetItem = initialTargetItem;
      let myItem = initialMyItem;

      if (data.item1_id && !targetItem) {
        const { data: item1 } = await supabase
          .from('items')
          .select('id, name, photos, estimated_value, condition, location')
          .eq('id', data.item1_id)
          .single();
        if (item1) {
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !user || !conversationId || sending) return;

    setSending(true);
    try {
      let content = newMessage.trim();

      if (imageFile) {
        setUploadingImage(true);
        const imageUrl = await uploadImage();
        if (imageUrl) {
          content = content ? `${content}\n[img]${imageUrl}[/img]` : `[img]${imageUrl}[/img]`;
        }
        setUploadingImage(false);
      }

      if (!content) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: imageFile ? 'image' : 'text',
        });

      if (error) throw error;
      setNewMessage("");
      clearImage();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setSending(false);
      setUploadingImage(false);
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
          content: `Hai! Aku mau tukar barangmu dengan barangku ini`,
          message_type: 'barter_proposal',
          item_id: item.id,
        });

      if (error) throw error;
      toast.success('Penawaran barter terkirim!');
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

  const renderMessageContent = (content: string) => {
    const imgRegex = /\[img\](.*?)\[\/img\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>
        );
      }
      parts.push(
        <img
          key={match.index}
          src={match[1]}
          alt="Shared image"
          className="rounded-lg max-w-full mt-1 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(match![1], '_blank')}
        />
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(<span key={lastIndex}>{content.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b bg-card px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-bold">Chat</span>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30 overflow-hidden">
      {/* FIXED HEADER */}
      <header className="border-b bg-card shadow-sm flex-shrink-0 z-10">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/chat')} className="rounded-full flex-shrink-0 h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9 flex-shrink-0">
              {conversation?.other_user?.profile_photo_url ? (
                <img
                  src={conversation.other_user.profile_photo_url}
                  alt={conversation.other_user.username}
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center rounded-full">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">
                {conversation?.other_user?.username || 'User'}
              </h1>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                Laporkan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* SCROLLABLE MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-3 space-y-3 max-w-4xl mx-auto">
          {/* Show item cards at the start of conversation */}
          {messages.length === 0 && (conversation?.target_item || initialTargetItem) && (
            <div className="space-y-2 mb-4">
              <p className="text-center text-xs text-muted-foreground">
                Memulai percakapan tentang barter
              </p>
              
              {(conversation?.target_item || initialTargetItem) && (
                <Card className="p-3 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px]">Barang yang diminati</Badge>
                  </div>
                  <div className="flex gap-3">
                    <img
                      src={(conversation?.target_item || initialTargetItem)?.photos[0]}
                      alt={(conversation?.target_item || initialTargetItem)?.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {(conversation?.target_item || initialTargetItem)?.name}
                      </h4>
                      <p className="text-primary font-bold text-sm">
                        {formatPrice((conversation?.target_item || initialTargetItem)?.estimated_value)}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{(conversation?.target_item || initialTargetItem)?.location}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {(conversation?.my_item || initialMyItem) && (
                <Card className="p-3 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="text-[10px] bg-primary">Barang penawaranmu</Badge>
                  </div>
                  <div className="flex gap-3">
                    <img
                      src={(conversation?.my_item || initialMyItem)?.photos[0]}
                      alt={(conversation?.my_item || initialMyItem)?.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {(conversation?.my_item || initialMyItem)?.name}
                      </h4>
                      <p className="text-primary font-bold text-sm">
                        {formatPrice((conversation?.my_item || initialMyItem)?.estimated_value)}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
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
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {isBarterProposal && message.item ? (
                  <div className="max-w-[80%] space-y-1.5">
                    <Card
                      className={isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                      }
                    >
                      <div className="p-3">
                        <p className="text-sm break-words">{message.content}</p>
                        <p className={`text-[10px] mt-1 ${
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
                    className={`max-w-[75%] ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    }`}
                  >
                    <div className="p-3">
                      <div className="text-sm break-words whitespace-pre-wrap">
                        {renderMessageContent(message.content)}
                      </div>
                      <p className={`text-[10px] mt-1 ${
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
      </div>

      {/* FIXED FOOTER - Message Input */}
      <div className="border-t bg-card flex-shrink-0 z-10">
        {/* Image Preview */}
        {imagePreview && (
          <div className="px-3 pt-2 pb-1">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
              <button
                onClick={clearImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} className="px-3 py-2 flex items-center gap-2 max-w-4xl mx-auto">
          <ItemProposalSelector onSelectItem={sendBarterProposal} />
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-9 w-9"
            onClick={() => imageInputRef.current?.click()}
            disabled={sending}
          >
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 h-9 text-sm"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            className="flex-shrink-0 h-9 w-9"
            disabled={(!newMessage.trim() && !imageFile) || sending}
          >
            {uploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

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
  );
}
