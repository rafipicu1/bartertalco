import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, Shield, Crown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionTier } from '@/hooks/useSubscription';

interface AccountInfoSectionProps {
  email?: string;
  createdAt?: string | null;
  tier: SubscriptionTier;
  subscriptionExpiresAt?: string | null;
  isAdmin: boolean;
  onSignOut: () => void;
}

export function AccountInfoSection({
  email,
  createdAt,
  tier,
  subscriptionExpiresAt,
  isAdmin,
  onSignOut,
}: AccountInfoSectionProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Informasi Akun
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{email}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Bergabung
            </span>
            <span className="text-sm font-medium">
              {createdAt ? new Date(createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              Plan
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={tier === 'free' ? 'secondary' : 'default'} className="capitalize">
                {tier}
              </Badge>
              {tier !== 'free' && subscriptionExpiresAt && (
                <span className="text-xs text-muted-foreground">
                  s/d {new Date(subscriptionExpiresAt).toLocaleDateString('id-ID')}
                </span>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Role
              </span>
              <Badge className="bg-destructive text-destructive-foreground">Admin</Badge>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Admin Panel
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/pricing')} className="gap-1.5">
            <Crown className="h-3.5 w-3.5" />
            {tier === 'free' ? 'Upgrade Plan' : 'Kelola Plan'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onSignOut} className="gap-1.5 text-destructive hover:text-destructive">
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
