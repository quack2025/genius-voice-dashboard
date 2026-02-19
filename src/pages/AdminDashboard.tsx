import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, FolderKanban, Mic2, Calendar, Building2, Plus } from 'lucide-react';
import { adminApi, type AdminStats, type AdminOrg } from '@/lib/adminApi';
import PlanBadge from '@/components/PlanBadge';
import { useToast } from '@/hooks/use-toast';

interface OrgForm {
  name: string;
  ownerEmail: string;
  plan: string;
  maxSeats: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState<OrgForm>({ name: '', ownerEmail: '', plan: 'enterprise', maxSeats: '10' });

  async function loadData() {
    const [statsResult, orgsResult] = await Promise.all([
      adminApi.getStats(),
      adminApi.getOrgs(),
    ]);
    if (statsResult.success && statsResult.data) setStats(statsResult.data);
    if (orgsResult.success && orgsResult.data) setOrgs((orgsResult.data as any).orgs || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreatingOrg(true);
    const result = await adminApi.createOrg({
      name: orgForm.name,
      ownerEmail: orgForm.ownerEmail,
      plan: orgForm.plan,
      maxSeats: parseInt(orgForm.maxSeats) || 10,
    });
    setCreatingOrg(false);

    if (result.success) {
      toast({ title: t('orgs.createSuccess') });
      setOrgForm({ name: '', ownerEmail: '', plan: 'enterprise', maxSeats: '10' });
      setShowCreateOrg(false);
      loadData();
    } else {
      toast({ title: t('orgs.createError'), description: result.error, variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: t('dashboard.totalUsers'), value: stats.total_users, icon: Users },
    { label: t('dashboard.totalProjects'), value: stats.total_projects, icon: FolderKanban },
    { label: t('dashboard.totalRecordings'), value: stats.total_recordings, icon: Mic2 },
    { label: t('dashboard.recordingsThisMonth'), value: stats.recordings_this_month, icon: Calendar },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users by Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('dashboard.usersByPlan')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats.users_by_plan).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <PlanBadge plan={plan} size="md" />
                <span className="text-xl font-bold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('orgs.title')}
          </CardTitle>
          <Button size="sm" onClick={() => setShowCreateOrg(!showCreateOrg)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('orgs.create')}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Create org form */}
          {showCreateOrg && (
            <form onSubmit={handleCreateOrg} className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t('orgs.name')}</Label>
                  <Input
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('orgs.ownerEmail')}</Label>
                  <Input
                    type="email"
                    value={orgForm.ownerEmail}
                    onChange={(e) => setOrgForm({ ...orgForm, ownerEmail: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('orgs.plan')}</Label>
                  <Select value={orgForm.plan} onValueChange={(v) => setOrgForm({ ...orgForm, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freelancer">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('orgs.maxSeats')}</Label>
                  <Input
                    type="number"
                    min="2"
                    max="100"
                    value={orgForm.maxSeats}
                    onChange={(e) => setOrgForm({ ...orgForm, maxSeats: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={creatingOrg}>
                {creatingOrg ? t('orgs.creating') : t('orgs.create')}
              </Button>
            </form>
          )}

          {/* Org list */}
          {orgs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('orgs.noOrgs')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orgs.name')}</TableHead>
                  <TableHead>{t('orgs.owner')}</TableHead>
                  <TableHead>{t('orgs.plan')}</TableHead>
                  <TableHead className="text-center">{t('orgs.members')}</TableHead>
                  <TableHead className="text-right">{t('orgs.usage')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.owner_email}</TableCell>
                    <TableCell><PlanBadge plan={org.plan} /></TableCell>
                    <TableCell className="text-center">{org.member_count} / {org.max_seats}</TableCell>
                    <TableCell className="text-right">
                      {org.responses_this_month.toLocaleString()} / {org.max_responses.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
