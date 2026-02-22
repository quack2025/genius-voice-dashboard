import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, User } from 'lucide-react';

interface PlanBadgeProps {
  plan: string;
  size?: 'sm' | 'md';
}

// DESIGN_SYSTEM.md section 8.1 — PlanBadge colors
const planConfig: Record<string, { icon: typeof Crown; className: string }> = {
  free:       { icon: User,  className: 'bg-muted text-muted-foreground' },
  freelancer: { icon: Zap,   className: 'bg-primary/10 text-primary' },
  pro:        { icon: Crown, className: 'bg-primary/15 text-primary' },
  enterprise: { icon: Crown, className: 'bg-primary/20 text-primary' },
};

export default function PlanBadge({ plan, size = 'sm' }: PlanBadgeProps) {
  const { t } = useTranslation('common');
  const config = planConfig[plan] || planConfig.free;
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={`${config.className} border-transparent ${size === 'md' ? 'text-sm px-3 py-1' : ''}`}>
      <Icon className={`${size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} mr-1`} />
      {t(`plans.names.${plan}`, plan.charAt(0).toUpperCase() + plan.slice(1))}
    </Badge>
  );
}
