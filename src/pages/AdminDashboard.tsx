import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, Mic2, Calendar } from 'lucide-react';
import { adminApi, type AdminStats } from '@/lib/adminApi';
import PlanBadge from '@/components/PlanBadge';

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then((result) => {
      if (result.success && result.data) setStats(result.data);
      setLoading(false);
    });
  }, []);

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
      <Card>
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
    </div>
  );
}
