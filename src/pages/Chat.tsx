import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MessageCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { MobileLayout } from "@/components/MobileLayout";
import { PageHeader } from "@/components/PageHeader";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  item1_id: string | null;
  item2_id: string | null;
  last_message_at: string;
  other_user?: {
    username: string;
    profile_photo_url: string | null;
  };
  last_message?: {
    content: string;
    sender_id: string;
  };
  unread_count?: number;
}

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchConversations();
    
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => fetchConversations()
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-read-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const conversationsWithData = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('username, profile_photo_url')
            .eq('id', otherUserId)
            .single();

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('read', false)
            .neq('sender_id', user.id);

          return {
            ...convo,
            other_user: profile,
            last_message: lastMessage,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <PageHeader 
          title="Chat" 
          icon={<MessageCircle className="h-5 w-5" />}
          onBack={() => navigate('/')}
        />

        <main className="container mx-auto px-3 py-3 max-w-lg">
          {conversations.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold mb-1">Belum Ada Percakapan</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Mulai chat dengan menghubungi pemilik barang
              </p>
              <Button onClick={() => navigate('/')} size="sm">
                Cari Barang
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  className="w-full text-left rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-colors active:scale-[0.99] p-3"
                  onClick={() => navigate(`/chat/${convo.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11">
                        {convo.other_user?.profile_photo_url ? (
                          <img
                            src={convo.other_user.profile_photo_url}
                            alt={convo.other_user.username}
                            className="object-cover w-full h-full rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center rounded-full">
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                        )}
                      </Avatar>
                      {convo.unread_count! > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-sm truncate">
                          {convo.other_user?.username || 'User'}
                        </h3>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(convo.last_message_at), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </span>
                      </div>
                      {convo.last_message && (
                        <p className={`text-xs line-clamp-1 ${
                          convo.unread_count! > 0 && convo.last_message.sender_id !== user?.id
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground'
                        }`}>
                          {convo.last_message.sender_id === user?.id && 'Kamu: '}
                          {convo.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </MobileLayout>
  );
}
