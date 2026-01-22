import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Project, Recording } from '@/integrations/supabase/client';
import { batchApi, exportApi } from '@/lib/api';
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-status-pending/10 text-status-pending border-status-pending/20',
      processing: 'bg-status-processing/10 text-status-processing border-status-processing/20',
      completed: 'bg-status-completed/10 text-status-completed border-status-completed/20',
      failed: 'bg-status-failed/10 text-status-failed border-status-failed/20',
    };

    const labels: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando',
      completed: 'Completado',
      failed: 'Fallido',
    };

    return (
      <Badge variant="outline" className={styles[status] || ''}>
        {labels[status] || status}
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
        description: 'Ingresa al menos un Session ID',
        variant: 'destructive',
      });
      return;
    }

    setBatchLoading(true);

    const response = await batchApi.prepare(id, sessionIds);

    if (!response.success || !response.data) {
      toast({
        title: 'Error al analizar',
        description: response.error || 'No se pudo analizar el batch',
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
      return;
    }

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
        title: data.status === 'completed' ? 'Transcripción completada' : 'Transcripción finalizada',
        description: `${data.progress.completed} transcritas, ${data.progress.failed} fallidas`,
      });
    }
  }, [id, fetchRecordings, toast]);

  const handleConfirmBatch = async () => {
    if (!id || !batchAnalysis?.batchId) return;

    setBatchLoading(true);

    const response = await batchApi.confirm(id, batchAnalysis.batchId);

    if (!response.success) {
      toast({
        title: 'Error al confirmar',
        description: response.error || 'No se pudo iniciar la transcripción',
        variant: 'destructive',
      });
      setBatchLoading(false);
      return;
    }

    setBatchProgress(0);
    setBatchLoading(false);

    // Start polling for status
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
        title: 'Error al exportar',
        description: response.error || 'No se pudo descargar el archivo',
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
      title: 'Exportación completada',
      description: 'El archivo CSV se descargó correctamente',
    });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!project) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proyectos
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Mic2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={project.transcription_mode === 'realtime' ? 'default' : 'secondary'}>
                {project.transcription_mode === 'realtime' ? 'Real-Time' : 'Batch'}
              </Badge>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm">
                {project.language === 'es' ? 'Español' : project.language === 'en' ? 'English' : 'Português'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recordings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recordings">Grabaciones</TabsTrigger>
          <TabsTrigger value="batch">Transcripción Batch</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
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
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
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
                  Aún no hay grabaciones
                </h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Integra el widget en tu encuesta para comenzar a capturar grabaciones de voz.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Transcripción</TableHead>
                      <TableHead>Acciones</TableHead>
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
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
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
                      Página {currentPage} de {totalPages}
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
                <CardTitle>Transcripción en progreso</CardTitle>
                <CardDescription>
                  Procesando {batchAnalysis?.toTranscribe || 0} grabaciones...
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
                <CardTitle>Resumen del análisis</CardTitle>
                <CardDescription>
                  Revisa el análisis antes de confirmar la transcripción
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Solicitados</p>
                    <p className="text-2xl font-bold">{batchAnalysis.requested}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Encontrados</p>
                    <p className="text-2xl font-bold text-status-completed">{batchAnalysis.found}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">No encontrados</p>
                    <p className="text-2xl font-bold text-status-failed">{batchAnalysis.notFound.length}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Ya transcritos</p>
                    <p className="text-2xl font-bold">{batchAnalysis.alreadyTranscribed}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Por transcribir</p>
                    <p className="text-2xl font-bold text-primary">{batchAnalysis.toTranscribe}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">Costo estimado</p>
                    <p className="text-2xl font-bold text-primary">${batchAnalysis.estimatedCost.toFixed(2)} USD</p>
                  </div>
                </div>

                {batchAnalysis.notFound.length > 0 && (
                  <div className="p-4 bg-status-failed/10 border border-status-failed/20 rounded-lg">
                    <p className="text-sm font-medium text-status-failed mb-2">Session IDs no encontrados:</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {batchAnalysis.notFound.join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setBatchAnalysis(null)} disabled={batchLoading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmBatch} disabled={batchLoading}>
                    {batchLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {batchLoading ? 'Procesando...' : 'Confirmar y Transcribir'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Transcripción Batch
                </CardTitle>
                <CardDescription>
                  Sube un archivo CSV o pega una lista de Session IDs para transcribir en lote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Arrastra un archivo CSV aquí o haz clic para seleccionar
                  </p>
                  <Button variant="outline" size="sm">
                    Seleccionar archivo
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">o</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pegar Session IDs (uno por línea o separados por coma)</Label>
                  <Textarea
                    placeholder="session_abc123&#10;session_def456&#10;session_ghi789"
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
                  {batchLoading ? 'Analizando...' : 'Analizar'}
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
                Exportar datos
              </CardTitle>
              <CardDescription>
                Descarga las grabaciones y transcripciones en formato CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Formato</Label>
                  <p className="text-sm text-muted-foreground">CSV (valores separados por coma)</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed-only"
                    checked={exportOnlyCompleted}
                    onCheckedChange={(checked) => setExportOnlyCompleted(checked as boolean)}
                  />
                  <Label htmlFor="completed-only">Incluir solo grabaciones completadas</Label>
                </div>
              </div>

              {recordings.length > 0 && (
                <div className="space-y-2">
                  <Label>Vista previa (primeras 5 filas)</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Session ID</TableHead>
                          <TableHead className="text-xs">Duración</TableHead>
                          <TableHead className="text-xs">Estado</TableHead>
                          <TableHead className="text-xs">Transcripción</TableHead>
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

              <Button onClick={handleExport} disabled={recordings.length === 0 || exportLoading}>
                {exportLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exportLoading ? 'Exportando...' : 'Descargar CSV'}
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
