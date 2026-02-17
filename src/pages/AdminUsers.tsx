import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormatters } from '@/hooks/useFormatters';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, type AdminUser, type PaginatedUsers } from '@/lib/adminApi';
import { PLANS } from '@/lib/plans';
import PlanBadge from '@/components/PlanBadge';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { formatDate } = useFormatters();
  const { toast } = useToast();

  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Plan change dialog
  const [changePlanUser, setChangePlanUser] = useState<AdminUser | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [changing, setChanging] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  useEffect(() => {
    setLoading(true);
    adminApi.getUsers(page, searchDebounced).then(result => {
      if (result.success && result.data) {
        setData(result.data);
      }
      setLoading(false);
    });
  }, [page, searchDebounced]);

  const handleChangePlan = async () => {
    if (!changePlanUser || !selectedPlan) return;
    setChanging(true);
    const result = await adminApi.updateUserPlan(changePlanUser.id, selectedPlan);
    setChanging(false);

    if (result.success) {
      toast({ title: t('planChanged') });
      setChangePlanUser(null);
      // Refresh list
      adminApi.getUsers(page, searchDebounced).then(r => {
        if (r.success && r.data) setData(r.data);
      });
    } else {
      toast({ title: t('planChangeFailed'), variant: 'destructive' });
    }
  };

  const openChangePlan = (user: AdminUser) => {
    setChangePlanUser(user);
    setSelectedPlan(user.plan);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('users.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('users.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !data || data.users.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {t('users.noUsers')}
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.email')}</TableHead>
                  <TableHead>{t('users.plan')}</TableHead>
                  <TableHead className="text-center">{t('users.projects')}</TableHead>
                  <TableHead className="text-center">{t('users.responsesMonth')}</TableHead>
                  <TableHead>{t('users.joined')}</TableHead>
                  <TableHead className="text-right">{t('users.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.email}</span>
                        {user.is_admin && (
                          <Badge variant="outline" className="text-[10px]">Admin</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => openChangePlan(user)} className="cursor-pointer hover:opacity-80">
                        <PlanBadge plan={user.plan} />
                      </button>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{user.projects_count}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{user.responses_this_month}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/users/${user.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t('users.view')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {tCommon('pagination.page', { current: data.pagination.page, total: data.pagination.total_pages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.total_pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Change Plan Dialog */}
      <Dialog open={!!changePlanUser} onOpenChange={(open) => { if (!open) setChangePlanUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {changePlanUser && t('changePlanFor', { email: changePlanUser.email })}
            </DialogTitle>
          </DialogHeader>
          {changePlanUser && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                {t('currentPlan', { plan: changePlanUser.plan_name })}
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanUser(null)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={changing || selectedPlan === changePlanUser?.plan}
            >
              {changing ? tCommon('buttons.loading') : t('changePlan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
