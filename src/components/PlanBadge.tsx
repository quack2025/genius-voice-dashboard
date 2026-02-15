import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, User } from 'lucide-react';

interface PlanBadgeProps {
  plan: string;
  size?: 'sm' | 'md';
}

const planConfig: Record<string, { icon: typeof Crown; variant: 'default' | 'secondary' | 'outline'; className: string }> = {
  enterprise: { icon: Crown, variant: 'default', className: 'bg-amber-600 hover:bg-amber-700' },
  pro: { icon: Crown, variant: 'default', className: 'bg-violet-600 hover:bg-violet-700' },
  freelancer: { icon: Zap, variant: 'default', className: 'bg-blue-600 hover:bg-blue-700' },
  free: { icon: User, variant: 'secondary', className: '' },
};

export default function PlanBadge({ plan, size = 'sm' }: PlanBadgeProps) {
  const { t } = useTranslation('common');
  const config = planConfig[plan] || planConfig.free;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${size === 'md' ? 'text-sm px-3 py-1' : ''}`}>
      <Icon className={`${size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} mr-1`} />
      {t(`plans.names.${plan}`, plan.charAt(0).toUpperCase() + plan.slice(1))}
    </Badge>
  );
}
