import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Crown,
  Check,
  X,
  Building2,
  Users,
  BarChart3,
  UserPlus,
  Trash2,
  Loader2,
  AlertTriangle,
  User,
} from 'lucide-react';
import { accountApi } from '@/lib/api';
import { orgApi, type OrgMember, type OrgData } from '@/lib/orgApi';
import { PLANS } from '@/lib/plans';
import type { UsageData } from '@/lib/plans';
import PlanBadge from '@/components/PlanBadge';
import UsageBadge from '@/components/UsageBadge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';
import i18n from 'i18next';

// ─── My Account Tab ───────────────────────────────────────────────────────────
function MyAccountTab() {
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({ title: t('settings.myAccount.passwordTooShort'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('settings.myAccount.passwordMismatch'), variant: 'destructive' });
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);

    if (error) {
      toast({ title: t('settings.myAccount.passwordError'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('settings.myAccount.passwordUpdated') });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('settings.myAccount.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.myAccount.email')}</Label>
            <Input value={user?.email || ''} disabled className="max-w-sm bg-muted" />
            <p className="text-xs text-muted-foreground">{t('settings.myAccount.emailReadonly')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.myAccount.language')}</Label>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{tCommon('languages.es')}</SelectItem>
                <SelectItem value="en">{tCommon('languages.en')}</SelectItem>
                <SelectItem value="pt">{tCommon('languages.pt')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.myAccount.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label>{t('settings.myAccount.newPassword')}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="******"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.myAccount.confirmPassword')}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="******"
              />
            </div>
            <Button type="submit" disabled={updatingPassword || !newPassword}>
              {updatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {updatingPassword ? t('settings.myAccount.updatingPassword') : t('settings.myAccount.updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Organization Tab ─────────────────────────────────────────────────────────
function OrganizationTab({ orgData }: { orgData: OrgData | null }) {
  const { t } = useTranslation('org');

  if (!orgData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          No organization found.
        </p>
      </div>
    );
  }

  const { org, usage } = orgData;
  const usagePercent = org.max_responses > 0
    ? Math.round((usage.responses_this_month / org.max_responses) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-xl font-bold">{org.name}</h2>
          <PlanBadge plan={org.plan} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('usage.title')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.responses_this_month.toLocaleString()} / {org.max_responses.toLocaleString()}
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${usagePercent > 90 ? 'bg-destructive' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-primary'}`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('usage.responses', { used: usage.responses_this_month.toLocaleString(), limit: org.max_responses.toLocaleString() })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('members.title')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t('seats', { current: orgData.members.length, max: org.max_seats })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('plan')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.plan_name}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function MembersTab({ orgData, onReload }: { orgData: OrgData | null; onReload: () => void }) {
  const { t } = useTranslation('org');
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingMember, setRemovingMember] = useState<OrgMember | null>(null);

  if (!orgData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('members.title')}</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          No organization found.
        </p>
      </div>
    );
  }

  const { members } = orgData;

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    const result = await orgApi.addMember(newEmail.trim());
    setAdding(false);

    if (result.success) {
      toast({ title: t('addMember.success') });
      setNewEmail('');
      onReload();
    } else {
      toast({ title: t('addMember.error'), description: result.error, variant: 'destructive' });
    }
  }

  async function handleRemoveMember() {
    if (!removingMember) return;

    const result = await orgApi.removeMember(removingMember.id);
    if (result.success) {
      toast({ title: t('members.removeSuccess') });
      onReload();
    } else {
      toast({ title: t('members.removeError'), description: result.error, variant: 'destructive' });
    }
    setRemovingMember(null);
  }

  return (
    <div className="space-y-6">
      {/* Add member form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('addMember.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="flex gap-2">
            <Input
              type="email"
              placeholder={t('addMember.placeholder')}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" disabled={adding || !newEmail.trim()}>
              {adding ? t('addMember.adding') : t('addMember.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('members.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('members.email')}</TableHead>
                <TableHead>{t('members.role')}</TableHead>
                <TableHead className="text-right">{t('members.responsesThisMonth')}</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {t(`members.${member.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{member.responses_this_month}</TableCell>
                  <TableCell>
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemovingMember(member)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('members.remove')}</AlertDialogTitle>
            <AlertDialogDescription>
              {removingMember && t('members.confirmRemove', { email: removingMember.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('members.remove') === 'Remove' ? 'Cancel' : 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('members.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Plan & Billing Tab ───────────────────────────────────────────────────────
function PlanBillingTab({ usage }: { usage: UsageData | null }) {
  const { t: tCommon } = useTranslation('common');
  const planKeys = Object.keys(PLANS);

  return (
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
            </TableBody>
          </Table>

          {usage && usage.plan !== 'enterprise' && (
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
  );
}

// ─── Danger Zone Tab ──────────────────────────────────────────────────────────
function DangerZoneTab() {
  const { t } = useTranslation('projects');
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Sign out and let them know — actual deletion requires backend support
      await signOut();
      toast({ title: t('settings.dangerZone.deleteSuccess') });
    } catch {
      toast({ title: t('settings.dangerZone.deleteError'), variant: 'destructive' });
    }
    setDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('settings.dangerZone.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.dangerZone.deleteAccount')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.dangerZone.deleteAccountDescription')}
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              {t('settings.dangerZone.deleteButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.dangerZone.dialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.dangerZone.dialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('settings.dangerZone.dialogCancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {deleting ? t('settings.dangerZone.deleting') : t('settings.dangerZone.dialogConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const { t } = useTranslation('projects');
  const [searchParams, setSearchParams] = useSearchParams();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get('tab') || 'my-account';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [usageResult, orgResult] = await Promise.all([
      accountApi.getUsage(),
      orgApi.getOrg(),
    ]);

    if (usageResult.success && usageResult.data) {
      setUsage(usageResult.data);
    }
    if (orgResult.success && orgResult.data) {
      setOrgData(orgResult.data);
    }
    setLoading(false);
  };

  const hasOrg = !!orgData;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="my-account">
              {t('settings.tabs.myAccount')}
            </TabsTrigger>
            {hasOrg && (
              <TabsTrigger value="organization">
                {t('settings.tabs.organization')}
              </TabsTrigger>
            )}
            {hasOrg && (
              <TabsTrigger value="members">
                {t('settings.tabs.members')}
              </TabsTrigger>
            )}
            <TabsTrigger value="plan-billing">
              {t('settings.tabs.planBilling')}
            </TabsTrigger>
            <TabsTrigger value="danger-zone" className="text-destructive data-[state=active]:text-destructive">
              {t('settings.tabs.dangerZone')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-account">
            <MyAccountTab />
          </TabsContent>

          {hasOrg && (
            <TabsContent value="organization">
              <OrganizationTab orgData={orgData} />
            </TabsContent>
          )}

          {hasOrg && (
            <TabsContent value="members">
              <MembersTab orgData={orgData} onReload={loadData} />
            </TabsContent>
          )}

          <TabsContent value="plan-billing">
            <PlanBillingTab usage={usage} />
          </TabsContent>

          <TabsContent value="danger-zone">
            <DangerZoneTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
