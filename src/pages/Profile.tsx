import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/MobileLayout';
import { PageHeader } from '@/components/PageHeader';
import { useSubscription } from '@/hooks/useSubscription';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ProfileInfoSection } from '@/components/profile/ProfileInfoSection';
import { ChangePasswordSection } from '@/components/profile/ChangePasswordSection';
import { AccountInfoSection } from '@/components/profile/AccountInfoSection';
import { UsageStatsSection } from '@/components/profile/UsageStatsSection';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { tier, limits, usage, subscription } = useSubscription();

  useEffect(() => {
    if (user) {
      loadProfile();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Berhasil keluar');
    navigate('/auth');
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-muted flex items-center justify-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-muted">
        <PageHeader title="Profil Saya" onBack={() => navigate('/')} />

        <main className="container mx-auto px-4 py-6 max-w-lg space-y-4 pb-24">
          {/* Avatar & Name */}
          <ProfileAvatar
            profile={profile}
            userId={user!.id}
            tier={tier}
            onUpdate={loadProfile}
          />

          {/* Editable Profile Info */}
          <ProfileInfoSection
            profile={profile}
            userId={user!.id}
            onUpdate={loadProfile}
          />

          {/* Change Password */}
          <ChangePasswordSection />

          {/* Usage Stats */}
          <UsageStatsSection
            tier={tier}
            usage={usage}
            limits={limits}
            extraSwipes={subscription?.extra_swipe_slots || 0}
            extraProposals={subscription?.extra_proposal_slots || 0}
          />

          {/* Account Info & Actions */}
          <AccountInfoSection
            email={user?.email}
            createdAt={profile?.created_at}
            tier={tier}
            subscriptionExpiresAt={subscription?.expires_at}
            isAdmin={isAdmin}
            onSignOut={handleSignOut}
          />
        </main>
      </div>
    </MobileLayout>
  );
}
