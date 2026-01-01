import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MessageCircle, ArrowLeft, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

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
    
    // Subscribe to new messages
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
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

      // Fetch related data for each conversation
      const conversationsWithData = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id;

          // Get other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, profile_photo_url')
            .eq('id', otherUserId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Chat</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Belum Ada Percakapan</h2>
            <p className="text-muted-foreground mb-6">
              Mulai chat dengan orang yang kamu match atau hubungi pemilik barang
            </p>
            <Button onClick={() => navigate('/swipe')}>
              Mulai Swipe
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((convo) => (
              <Card
                key={convo.id}
                className="hover:shadow-lg transition-all cursor-pointer hover-scale"
                onClick={() => navigate(`/chat/${convo.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        {convo.other_user?.profile_photo_url ? (
                          <img
                            src={convo.other_user.profile_photo_url}
                            alt={convo.other_user.username}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <User className="h-7 w-7 text-white" />
                          </div>
                        )}
                      </Avatar>
                      {convo.unread_count! > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white">
                          {convo.unread_count}
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-lg">
                          {convo.other_user?.username || 'User'}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(convo.last_message_at), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </span>
                      </div>
                      {convo.last_message && (
                        <p className={`text-sm line-clamp-2 ${
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
