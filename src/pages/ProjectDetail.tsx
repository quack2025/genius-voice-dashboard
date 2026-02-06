import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Project, Recording } from '@/integrations/supabase/client';
import { batchApi, exportApi } from '@/lib/api';
import { useFormatters } from '@/hooks/useFormatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, RefreshCw, Mic2, Upload, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import AudioPlayerModal from '@/components/AudioPlayerModal';
import { LANGUAGE_NAMES, SupportedLanguage } from '@/i18n';

const ITEMS_PER_PAGE = 10;

interface BatchAnalysis {
  batchId: string;
  requested: number;
  found: number;
  notFound: string[];
  alreadyTranscribed: number;
  toTranscribe: number;
  estimatedCost: number;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
  const { formatDuration, formatCurrency } = useFormatters();
  const [project, setProject] = useState<Project | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Batch transcription state
  const [batchInput, setBatchInput] = useState('');
  const [batchAnalysis, setBatchAnalysis] = useState<BatchAnalysis | null>(null);
  const [batchProgress, setBatchProgress] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollErrorCountRef = useRef(0);

  // Export state
  const [exportOnlyCompleted, setExportOnlyCompleted] = useState(true);

  // Audio player state
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setProject(data as Project);
    }
  }, [id]);

  const fetchRecordings = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    let query = supabase
      .from('recordings')
      .select('*', { count: 'exact' })
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (!error) {
      setRecordings((data || []) as Recording[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [id, currentPage, statusFilter]);

  useEffect(() => {
    fetchProject();
    fetchRecordings();
  }, [fetchProject, fetchRecordings]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-status-pending/10 text-status-pending border-status-pending/20',
      processing: 'bg-status-processing/10 text-status-processing border-status-processing/20',
      completed: 'bg-status-completed/10 text-status-completed border-status-completed/20',
      failed: 'bg-status-failed/10 text-status-failed border-status-failed/20',
    };

    return (
      <Badge variant="outline" className={styles[status] || ''}>
        {tCommon(`status.${status}`)}
      </Badge>
    );
  };

  const handlePlayAudio = (recording: Recording) => {
    setPlayingRecording(recording);
  };

  const handleAnalyzeBatch = async () => {
    if (!id) return;

    const sessionIds = batchInput
      .split(/[\n,]/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (sessionIds.length === 0) {
      toast({
        title: 'Error',
        description: t('batch.enterSessionIds'),
        variant: 'destructive',
      });
      return;
    }

    setBatchLoading(true);

    const response = await batchApi.prepare(id, sessionIds);

    if (!response.success || !response.data) {
      toast({
        title: t('batch.analyzeError'),
        description: response.error || t('batch.analyzeErrorMessage'),
        variant: 'destructive',
      });
      setBatchLoading(false);
      return;
    }

    const data = response.data;
    setBatchAnalysis({
      batchId: data.batch_id,
      requested: data.summary.requested,
      found: data.summary.found,
      notFound: data.not_found_session_ids,
      alreadyTranscribed: data.summary.already_transcribed,
      toTranscribe: data.summary.to_transcribe,
      estimatedCost: data.estimated_cost_usd,
    });
    setBatchLoading(false);
  };

  const pollBatchStatus = useCallback(async (batchId: string) => {
    if (!id) return;

    const response = await batchApi.getStatus(id, batchId);

    if (!response.success || !response.data) {
      pollErrorCountRef.current++;
      if (pollErrorCountRef.current >= 5) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setBatchProgress(null);
        toast({
          title: t('batch.confirmError'),
          description: t('batch.pollErrorMessage'),
          variant: 'destructive',
        });
      }
      return;
    }

    pollErrorCountRef.current = 0;
    const data = response.data;
    const total = data.progress.total;
    const completed = data.progress.completed + data.progress.failed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    setBatchProgress(progress);

    if (data.status === 'completed' || data.status === 'partial' || data.status === 'failed') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setBatchProgress(null);
      setBatchAnalysis(null);
      setBatchInput('');
      fetchRecordings();

      toast({
        title: data.status === 'completed' ? t('batch.completed') : t('batch.completedPartial'),
        description: t('batch.completedMessage', { completed: data.progress.completed, failed: data.progress.failed }),
      });
    }
  }, [id, fetchRecordings, toast, t]);

  const handleConfirmBatch = async () => {
    if (!id || !batchAnalysis?.batchId) return;

    setBatchLoading(true);

    const response = await batchApi.confirm(id, batchAnalysis.batchId);

    if (!response.success) {
      toast({
        title: t('batch.confirmError'),
        description: response.error || t('batch.confirmErrorMessage'),
        variant: 'destructive',
      });
      setBatchLoading(false);
      return;
    }

    setBatchProgress(0);
    setBatchLoading(false);

    // Start polling for status
    pollErrorCountRef.current = 0;
    pollIntervalRef.current = setInterval(() => {
      pollBatchStatus(batchAnalysis.batchId);
    }, 3000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleExport = async () => {
    if (!id) return;

    setExportLoading(true);

    const response = await exportApi.exportCsv(id, exportOnlyCompleted ? 'completed' : 'all');

    if (!response.success || !response.data) {
      toast({
        title: t('export.error'),
        description: response.error || t('export.errorMessage'),
        variant: 'destructive',
      });
      setExportLoading(false);
      return;
    }

    // Download the file
    const url = URL.createObjectURL(response.data.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.data.filename || `${project?.name || 'recordings'}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setExportLoading(false);

    toast({
      title: t('export.success'),
      description: t('export.successMessage'),
    });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!project) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('detail.backToProjects')}
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Mic2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={project.transcription_mode === 'realtime' ? 'default' : 'secondary'}>
                {tCommon(`transcriptionModes.${project.transcription_mode}`)}
              </Badge>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm">
                {LANGUAGE_NAMES[project.language as SupportedLanguage] || project.language}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recordings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recordings">{t('detail.tabs.recordings')}</TabsTrigger>
          <TabsTrigger value="batch">{t('detail.tabs.batch')}</TabsTrigger>
          <TabsTrigger value="export">{t('detail.tabs.export')}</TabsTrigger>
        </TabsList>

        {/* Recordings Tab */}
        <TabsContent value="recordings" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('detail.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('status.all')}</SelectItem>
                <SelectItem value="pending">{tCommon('status.pending')}</SelectItem>
                <SelectItem value="processing">{tCommon('status.processing')}</SelectItem>
                <SelectItem value="completed">{tCommon('status.completed')}</SelectItem>
                <SelectItem value="failed">{tCommon('status.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </CardContent>
            </Card>
          ) : recordings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Mic2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('detail.noRecordings')}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  {t('detail.noRecordingsHint')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('detail.table.sessionId')}</TableHead>
                      <TableHead>{t('detail.table.duration')}</TableHead>
                      <TableHead>{t('detail.table.status')}</TableHead>
                      <TableHead>{t('detail.table.transcription')}</TableHead>
                      <TableHead>{t('detail.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordings.map((recording) => (
                      <TableRow key={recording.id}>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="font-mono text-sm">
                                {recording.session_id.slice(0, 12)}...
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono">{recording.session_id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDuration(recording.duration_seconds)}
                        </TableCell>
                        <TableCell>{getStatusBadge(recording.status)}</TableCell>
                        <TableCell className="max-w-xs">
                          {recording.transcription ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left truncate block max-w-xs">
                                  {recording.transcription.slice(0, 50)}...
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  <p>{recording.transcription}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePlayAudio(recording)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {tCommon('pagination.showing', {
                      from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      to: Math.min(currentPage * ITEMS_PER_PAGE, totalCount),
                      total: totalCount
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {tCommon('pagination.page', { current: currentPage, total: totalPages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Batch Transcription Tab */}
        <TabsContent value="batch" className="space-y-6">
          {batchProgress !== null ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('batch.inProgress')}</CardTitle>
                <CardDescription>
                  {t('batch.processingRecordings', { count: batchAnalysis?.toTranscribe || 0 })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={batchProgress} />
                <p className="text-sm text-muted-foreground text-center">{batchProgress}%</p>
              </CardContent>
            </Card>
          ) : batchAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('batch.summaryTitle')}</CardTitle>
                <CardDescription>
                  {t('batch.summarySubtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('batch.requested')}</p>
                    <p className="text-2xl font-bold">{batchAnalysis.requested}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('batch.found')}</p>
                    <p className="text-2xl font-bold text-status-completed">{batchAnalysis.found}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('batch.notFound')}</p>
                    <p className="text-2xl font-bold text-status-failed">{batchAnalysis.notFound.length}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('batch.alreadyTranscribed')}</p>
                    <p className="text-2xl font-bold">{batchAnalysis.alreadyTranscribed}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{t('batch.toTranscribe')}</p>
                    <p className="text-2xl font-bold text-primary">{batchAnalysis.toTranscribe}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">{t('batch.estimatedCost')}</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(batchAnalysis.estimatedCost)}</p>
                  </div>
                </div>

                {batchAnalysis.notFound.length > 0 && (
                  <div className="p-4 bg-status-failed/10 border border-status-failed/20 rounded-lg">
                    <p className="text-sm font-medium text-status-failed mb-2">{t('batch.notFoundIds')}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {batchAnalysis.notFound.join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setBatchAnalysis(null)} disabled={batchLoading}>
                    {tCommon('buttons.cancel')}
                  </Button>
                  <Button onClick={handleConfirmBatch} disabled={batchLoading}>
                    {batchLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {batchLoading ? t('batch.processing') : t('batch.confirmAndTranscribe')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {t('batch.title')}
                </CardTitle>
                <CardDescription>
                  {t('batch.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('batch.dragDrop')}
                  </p>
                  <Button variant="outline" size="sm">
                    {t('batch.selectFile')}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('batch.or')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('batch.pasteLabel')}</Label>
                  <Textarea
                    placeholder={t('batch.pastePlaceholder')}
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    rows={6}
                    className="font-mono"
                  />
                </div>

                <Button
                  onClick={handleAnalyzeBatch}
                  disabled={!batchInput.trim() || batchLoading}
                  className="w-full"
                >
                  {batchLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {batchLoading ? t('batch.analyzing') : t('batch.analyze')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
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

              {recordings.length > 0 && (
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
                        {(exportOnlyCompleted
                          ? recordings.filter(r => r.status === 'completed')
                          : recordings
                        ).slice(0, 5).map((recording) => (
                          <TableRow key={recording.id}>
                            <TableCell className="text-xs font-mono">
                              {recording.session_id.slice(0, 12)}...
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatDuration(recording.duration_seconds)}
                            </TableCell>
                            <TableCell className="text-xs">{tCommon(`status.${recording.status}`)}</TableCell>
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

              <Button onClick={handleExport} disabled={recordings.length === 0 || exportLoading}>
                {exportLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exportLoading ? t('export.downloading') : t('export.download')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audio Player Modal */}
      <AudioPlayerModal
        recording={playingRecording}
        onClose={() => setPlayingRecording(null)}
      />
    </div>
  );
}
