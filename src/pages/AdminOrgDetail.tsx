import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '@/hooks/useFormatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { adminApi, type AdminOrgDetail as AdminOrgDetailType } from '@/lib/adminApi';
import PlanBadge from '@/components/PlanBadge';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrgDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { formatDate } = useFormatters();
  const { toast } = useToast();

  const [data, setData] = useState<AdminOrgDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editMaxSeats, setEditMaxSeats] = useState('');

  const fetchOrg = () => {
    if (!id) return;
    setLoading(true);
    adminApi.getOrgDetail(id).then((result) => {
      if (result.success && result.data) {
        setData(result.data);
        setEditName(result.data.org.name);
        setEditPlan(result.data.org.plan);
        setEditMaxSeats(String(result.data.org.max_seats));
      }
      setLoading(false);
    });
  };

  useEffect(() => { fetchOrg(); }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const result = await adminApi.updateOrg(id, {
      name: editName,
      plan: editPlan,
      maxSeats: parseInt(editMaxSeats) || 10,
    });
    setSaving(false);
    if (result.success) {
      toast({ title: t('updateOrgSuccess') });
      fetchOrg();
    } else {
      toast({ title: result.error || tCommon('errors.generic'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const result = await adminApi.deleteOrg(id);
    setDeleting(false);
    if (result.success) {
      toast({ title: t('deleteOrgSuccess') });
      navigate('/admin/orgs');
    } else {
      toast({ title: result.error || tCommon('errors.generic'), variant: 'destructive' });
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

  const { org, members, usage } = data;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" className="mb-4" asChild>
        <Link to="/admin/orgs">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToOrgs')}
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('orgDetail')}</h1>
      </div>

      <div className="space-y-6">
        {/* Org Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orgInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('orgs.name')}</span>
              <span className="font-medium">{org.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('orgs.plan')}</span>
              <PlanBadge plan={org.plan} size="md" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('orgs.owner')}</span>
              <span className="font-medium">{org.owner_email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('orgs.members')}</span>
              <span className="font-medium">{org.member_count} / {org.max_seats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('orgs.usage')}</span>
              <span className="font-medium">
                {usage.responses_this_month.toLocaleString()} / {usage.max_responses.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('userDetail.memberSince')}</span>
              <span className="font-medium">{formatDate(org.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Org */}
        <Card>
          <CardHeader>
            <CardTitle>{t('editOrgSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>{t('orgs.name')}</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <Label>{t('orgs.plan')}</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
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
                  min="1"
                  max="100"
                  value={editMaxSeats}
                  onChange={(e) => setEditMaxSeats(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleSave} disabled={saving}>
              {saving ? tCommon('buttons.loading') : tCommon('buttons.save')}
            </Button>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>{t('orgMembers')}</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('orgs.noOrgs')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>{t('role')}</TableHead>
                    <TableHead>{t('joinedAt')}</TableHead>
                    <TableHead className="text-right">{t('responsesMonth')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(member.joined_at)}</TableCell>
                      <TableCell className="text-right">{member.responses_this_month.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('deleteOrg')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('confirmDeleteOrg', { name: org.name })}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('deleteOrg')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteOrg')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('confirmDeleteOrg', { name: org.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon('buttons.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? tCommon('buttons.loading') : tCommon('buttons.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
