import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { orgApi, type OrgMember, type OrgData } from '@/lib/orgApi';
import PlanBadge from '@/components/PlanBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Building2, Users, BarChart3, UserPlus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrgSettings() {
  const { t } = useTranslation('org');
  const { toast } = useToast();
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingMember, setRemovingMember] = useState<OrgMember | null>(null);

  async function loadOrg() {
    const result = await orgApi.getOrg();
    if (result.success && result.data) {
      setOrgData(result.data);
    }
    setLoading(false);
  }

  useEffect(() => { loadOrg(); }, []);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    const result = await orgApi.addMember(newEmail.trim());
    setAdding(false);

    if (result.success) {
      toast({ title: t('addMember.success') });
      setNewEmail('');
      loadOrg();
    } else {
      toast({ title: t('addMember.error'), description: result.error, variant: 'destructive' });
    }
  }

  async function handleRemoveMember() {
    if (!removingMember) return;

    const result = await orgApi.removeMember(removingMember.id);
    if (result.success) {
      toast({ title: t('members.removeSuccess') });
      loadOrg();
    } else {
      toast({ title: t('members.removeError'), description: result.error, variant: 'destructive' });
    }
    setRemovingMember(null);
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  if (!orgData) {
    return <div className="p-8 text-muted-foreground">No organization found</div>;
  }

  const { org, usage, members } = orgData;
  const usagePercent = org.max_responses > 0
    ? Math.round((usage.responses_this_month / org.max_responses) * 100)
    : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm text-muted-foreground">
            <PlanBadge plan={org.plan} />
          </p>
        </div>
      </div>

      {/* Stats cards */}
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
              {t('seats', { current: members.length, max: org.max_seats })}
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
            <AlertDialogAction onClick={handleRemoveMember}>
              {t('members.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
