import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Recording } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Export() {
  const { user } = useAuth();
  const { toast } = useToast();
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
        title: 'Sin datos',
        description: 'No hay proyectos para exportar',
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
        title: 'Sin datos',
        description: 'No hay grabaciones para exportar',
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
      title: 'Exportación completada',
      description: `Se exportaron ${recordings.length} grabaciones`,
    });

    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Exportar</h1>
        <p className="text-muted-foreground mt-1">Descarga tus grabaciones y transcripciones</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar datos
          </CardTitle>
          <CardDescription>
            Descarga todas las grabaciones de tus proyectos en formato CSV
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

          <div className="flex gap-4">
            <Button variant="outline" onClick={fetchPreview} disabled={loading}>
              Ver preview
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Exportando...' : 'Descargar CSV'}
            </Button>
          </div>

          {previewData.length > 0 && (
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
