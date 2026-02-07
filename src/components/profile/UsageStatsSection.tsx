import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionTier } from '@/hooks/useSubscription';

interface UsageStatsSectionProps {
  tier: SubscriptionTier;
  usage: { swipe_count: number; proposal_count: number; items_viewed: number };
  limits: { daily_swipes: number; daily_proposals: number; daily_views: number };
  extraSwipes: number;
  extraProposals: number;
}

export function UsageStatsSection({ tier, usage, limits, extraSwipes, extraProposals }: UsageStatsSectionProps) {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Swipe',
      used: usage.swipe_count,
      max: limits.daily_swipes + extraSwipes,
    },
    {
      label: 'Proposal',
      used: usage.proposal_count,
      max: limits.daily_proposals + extraProposals,
    },
    {
      label: 'Views',
      used: usage.items_viewed || 0,
      max: limits.daily_views,
    },
  ];

  return (
    <Card className="border-primary/20">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Penggunaan Hari Ini
          </h3>
          {tier === 'free' && (
            <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {stats.map((stat) => {
            const percentage = stat.max > 0 ? Math.min((stat.used / stat.max) * 100, 100) : 0;
            const isUnlimited = stat.max >= 999999;

            return (
              <div key={stat.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="font-semibold">
                    {stat.used}/{isUnlimited ? '∞' : stat.max}
                  </span>
                </div>
                <Progress value={isUnlimited ? 0 : percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
