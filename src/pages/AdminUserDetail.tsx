import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '@/hooks/useFormatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Shield } from 'lucide-react';
import { adminApi, type AdminUserDetail as AdminUserDetailType } from '@/lib/adminApi';
import { PLANS } from '@/lib/plans';
import PlanBadge from '@/components/PlanBadge';
import { useToast } from '@/hooks/use-toast';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { formatDate } = useFormatters();
  const { toast } = useToast();

  const [data, setData] = useState<AdminUserDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  // Plan change dialog
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [changing, setChanging] = useState(false);

  const fetchUser = () => {
    if (!id) return;
    setLoading(true);
    adminApi.getUser(id).then(result => {
      if (result.success && result.data) {
        setData(result.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleChangePlan = async () => {
    if (!id || !selectedPlan) return;
    setChanging(true);
    const result = await adminApi.updateUserPlan(id, selectedPlan);
    setChanging(false);

    if (result.success) {
      toast({ title: t('planChanged') });
      setShowChangePlan(false);
      fetchUser();
    } else {
      toast({ title: t('planChangeFailed'), variant: 'destructive' });
    }
  };

  const openChangePlan = () => {
    if (data) {
      setSelectedPlan(data.user.plan);
      setShowChangePlan(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const { user, projects, usage_history } = data;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" className="mb-4" asChild>
        <Link to="/admin/users">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('userDetail.backToUsers')}
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('userDetail.title')}</h1>
      </div>

      <div className="space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('userDetail.userInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.email}</span>
                {user.is_admin && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {t('userDetail.adminBadge')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{tCommon('plans.currentPlan')}</span>
              <button onClick={openChangePlan} className="cursor-pointer hover:opacity-80">
                <PlanBadge plan={user.plan} size="md" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('userDetail.memberSince')}</span>
              <span className="font-medium">{formatDate(user.created_at)}</span>
            </div>
            {user.plan_started_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('userDetail.planStarted')}</span>
                <span className="font-medium">{formatDate(user.plan_started_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Plan Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('userDetail.changePlanSection')}</CardTitle>
              <Button size="sm" onClick={openChangePlan}>
                {t('changePlan')}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>{t('userDetail.projectsSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('userDetail.noProjects')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.language}</TableCell>
                      <TableCell>
                        <Badge variant={project.transcription_mode === 'realtime' ? 'default' : 'secondary'}>
                          {tCommon(`transcriptionModes.${project.transcription_mode}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(project.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card>
          <CardHeader>
            <CardTitle>{t('userDetail.usageSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            {usage_history.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('userDetail.noUsage')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('userDetail.month')}</TableHead>
                    <TableHead className="text-right">{t('userDetail.responses')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage_history.map((entry) => (
                    <TableRow key={entry.month}>
                      <TableCell className="font-medium">{entry.month}</TableCell>
                      <TableCell className="text-right">{entry.responses_count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlan} onOpenChange={setShowChangePlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('changePlanFor', { email: user.email })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t('currentPlan', { plan: user.plan_name })}
            </p>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPlan')} />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PLANS).map(key => (
                  <SelectItem key={key} value={key}>
                    {PLANS[key].name} — ${PLANS[key].price}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlan(false)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={changing || selectedPlan === user.plan}
            >
              {changing ? tCommon('buttons.loading') : t('changePlan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
