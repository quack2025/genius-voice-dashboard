import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, Project } from '@/integrations/supabase/client';
import { exportApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Export() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [exportOnlyCompleted, setExportOnlyCompleted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    setProjects((data || []) as Project[]);
    setProjectsLoading(false);
  };

  const handleExport = async () => {
    if (!selectedProjectId) {
      toast({
        title: t('export.error'),
        description: t('export.selectProjectFirst'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const response = await exportApi.exportCsv(
      selectedProjectId,
      exportOnlyCompleted ? 'completed' : 'all'
    );

    if (!response.success || !response.data) {
      toast({
        title: t('export.error'),
        description: response.error || t('export.errorMessage'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const url = URL.createObjectURL(response.data.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.data.filename || `voice-capture-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('export.success'),
      description: t('export.successMessage'),
    });

    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('export.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('export.subtitle')}</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('export.title')}
          </CardTitle>
          <CardDescription>
            {t('export.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Project selector */}
            <div className="space-y-2">
              <Label className="text-base">{t('export.selectProject')}</Label>
              {projectsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </div>
              ) : (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('export.selectProjectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-base">{t('export.format')}</Label>
              <p className="text-sm text-muted-foreground">{t('export.formatValue')}</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="completed-only"
                checked={exportOnlyCompleted}
                onCheckedChange={(checked) => setExportOnlyCompleted(checked as boolean)}
              />
              <Label htmlFor="completed-only">{t('export.onlyCompleted')}</Label>
            </div>
          </div>

          <Button onClick={handleExport} disabled={loading || !selectedProjectId}>
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {loading ? t('export.downloading') : t('export.download')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
