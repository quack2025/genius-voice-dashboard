import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

interface UsageBadgeProps {
  current: number;
  limit: number | null;
  label: string;
  className?: string;
}

export default function UsageBadge({ current, limit, label, className = '' }: UsageBadgeProps) {
  const { t } = useTranslation('common');

  if (limit === null) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium">{current} / {t('plans.unlimited')}</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium ${isCritical ? 'text-destructive' : isWarning ? 'text-[hsl(var(--warning))]' : ''}`}>
          {current} / {limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isCritical ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-[hsl(var(--warning))]' : ''}`}
      />
    </div>
  );
}
