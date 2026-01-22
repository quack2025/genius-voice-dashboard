import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Recording } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFormatters } from '@/hooks/useFormatters';

export default function Export() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
  const { formatDuration } = useFormatters();
  const [exportOnlyCompleted, setExportOnlyCompleted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Recording[]>([]);

  const fetchPreview = async () => {
    setLoading(true);

    // First get user's projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id');

    if (!projects || projects.length === 0) {
      setPreviewData([]);
      setLoading(false);
      return;
    }

    const projectIds = projects.map(p => p.id);

    let query = supabase
      .from('recordings')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (exportOnlyCompleted) {
      query = query.eq('status', 'completed');
    }

    const { data } = await query;
    setPreviewData((data || []) as Recording[]);
    setLoading(false);
  };

  const handleExport = async () => {
    setLoading(true);

    const { data: projects } = await supabase
      .from('projects')
      .select('id');

    if (!projects || projects.length === 0) {
      toast({
        title: t('export.error'),
        description: t('export.errorMessage'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const projectIds = projects.map(p => p.id);

    let query = supabase
      .from('recordings')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (exportOnlyCompleted) {
      query = query.eq('status', 'completed');
    }

    const { data: recordings } = await query;

    if (!recordings || recordings.length === 0) {
      toast({
        title: t('export.error'),
        description: t('export.errorMessage'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const csv = [
      ['Session ID', 'Project ID', 'Duration (s)', 'Status', 'Transcription', 'Created At'].join(','),
      ...recordings.map(r => [
        r.session_id,
        r.project_id,
        r.duration_seconds,
        r.status,
        `"${(r.transcription || '').replace(/"/g, '""')}"`,
        r.created_at,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-capture-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('export.success'),
      description: t('export.successMessage'),
    });

    setLoading(false);
  };

  return (
    <div className="p-8">
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

          <div className="flex gap-4">
            <Button variant="outline" onClick={fetchPreview} disabled={loading}>
              {t('export.preview')}
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? t('export.downloading') : t('export.download')}
            </Button>
          </div>

          {previewData.length > 0 && (
            <div className="space-y-2">
              <Label>{t('export.preview')}</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t('detail.table.sessionId')}</TableHead>
                      <TableHead className="text-xs">{t('detail.table.duration')}</TableHead>
                      <TableHead className="text-xs">{t('detail.table.status')}</TableHead>
                      <TableHead className="text-xs">{t('detail.table.transcription')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((recording) => (
                      <TableRow key={recording.id}>
                        <TableCell className="text-xs font-mono">
                          {recording.session_id.slice(0, 12)}...
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDuration(recording.duration_seconds)}
                        </TableCell>
                        <TableCell className="text-xs">{recording.status}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {recording.transcription || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
