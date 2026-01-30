import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Sparkles } from 'lucide-react';
import { SubscriptionTier } from '@/hooks/useSubscription';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SubscriptionBadge({ tier, size = 'md', showLabel = true }: SubscriptionBadgeProps) {
  if (tier === 'free') return null;

  const config = {
    plus: {
      label: 'PLUS',
      icon: Zap,
      className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0',
    },
    pro: {
      label: 'PRO',
      icon: Sparkles,
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0',
    },
  };

  const { label, icon: Icon, className } = config[tier];
  
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeSize = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <Badge className={`${className} ${badgeSize[size]} inline-flex items-center gap-1`}>
      <Icon className={iconSize[size]} />
      {showLabel && label}
    </Badge>
  );
}
