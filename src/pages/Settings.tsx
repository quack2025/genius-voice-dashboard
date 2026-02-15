import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Crown, Check, X } from 'lucide-react';
import { accountApi } from '@/lib/api';
import { PLANS } from '@/lib/plans';
import type { UsageData } from '@/lib/plans';
import PlanBadge from '@/components/PlanBadge';
import UsageBadge from '@/components/UsageBadge';

export default function Settings() {
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    const result = await accountApi.getUsage();
    if (result.success && result.data) {
      setUsage(result.data);
    }
    setLoading(false);
  };

  const planKeys = Object.keys(PLANS);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan & Usage */}
          {usage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    {tCommon('plans.currentPlan')}
                  </CardTitle>
                  <PlanBadge plan={usage.plan} size="md" />
                </div>
                <CardDescription>
                  {tCommon('plans.month', { month: usage.month })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <UsageBadge
                  current={usage.usage.responses_this_month}
                  limit={usage.limits.max_responses}
                  label={tCommon('plans.responses')}
                />
                <UsageBadge
                  current={usage.usage.projects_count}
                  limit={usage.limits.max_projects}
                  label={tCommon('plans.projects')}
                />
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">{tCommon('plans.maxDuration')}</span>
                  <span className="font-medium">{usage.limits.max_duration}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tCommon('plans.retention')}</span>
                  <span className="font-medium">{usage.limits.retention_days} {tCommon('plans.days')}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                {tCommon('plans.comparePlans')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tCommon('plans.feature')}</TableHead>
                    {planKeys.map(key => (
                      <TableHead key={key} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold">{PLANS[key].name}</span>
                          <span className="text-xs text-muted-foreground">
                            {PLANS[key].price === 0 ? tCommon('plans.freePrice') : `$${PLANS[key].price}/mo`}
                          </span>
                          {usage?.plan === key && (
                            <Badge variant="outline" className="text-[10px]">{tCommon('plans.current')}</Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.responses')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">{PLANS[key].max_responses.toLocaleString()}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.projects')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">{PLANS[key].max_projects ?? tCommon('plans.unlimited')}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.maxDuration')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">{PLANS[key].max_duration}s</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.languages')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">
                        {PLANS[key].languages === null ? tCommon('plans.allLanguages') : PLANS[key].languages!.length}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.batch')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">
                        {PLANS[key].batch ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.customThemes')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">
                        {PLANS[key].custom_themes ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.customDomains')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">
                        {PLANS[key].custom_domains ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{tCommon('plans.retention')}</TableCell>
                    {planKeys.map(key => (
                      <TableCell key={key} className="text-center">{PLANS[key].retention_days} {tCommon('plans.days')}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>

              {usage && usage.plan !== 'pro' && (
                <div className="mt-4 text-center">
                  <Button disabled className="gap-2">
                    <Crown className="h-4 w-4" />
                    {tCommon('plans.upgrade')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">{tCommon('plans.contactUs')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
