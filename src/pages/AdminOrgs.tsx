import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Building2, Plus, Search } from 'lucide-react';
import { adminApi, type AdminOrg } from '@/lib/adminApi';
import PlanBadge from '@/components/PlanBadge';
import { useToast } from '@/hooks/use-toast';

interface OrgForm {
  name: string;
  ownerEmail: string;
  plan: string;
  maxSeats: string;
}

export default function AdminOrgs() {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState<OrgForm>({ name: '', ownerEmail: '', plan: 'enterprise', maxSeats: '10' });

  async function loadOrgs() {
    const result = await adminApi.getOrgs();
    if (result.success && result.data) setOrgs((result.data as any).orgs || []);
    setLoading(false);
  }

  useEffect(() => { loadOrgs(); }, []);

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
      loadOrgs();
    } else {
      toast({ title: t('orgs.createError'), description: result.error, variant: 'destructive' });
    }
  }

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          {t('orgs.title')}
        </h1>
      </div>

      {/* Search + Create */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={t('searchOrgs')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCreateOrg(!showCreateOrg)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('orgs.create')}
        </Button>
      </div>

      {/* Create org form */}
      {showCreateOrg && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('orgs.create')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-4">
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
          </CardContent>
        </Card>
      )}

      {/* Org list */}
      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('orgs.noOrgs')}</p>
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
                {filtered.map((org) => (
                  <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link to={`/admin/orgs/${org.id}`} className="hover:underline">
                        {org.name}
                      </Link>
                    </TableCell>
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
