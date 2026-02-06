import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, Recording } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic2, Play, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import AudioPlayerModal from '@/components/AudioPlayerModal';
import { useFormatters } from '@/hooks/useFormatters';

const ITEMS_PER_PAGE = 10;

export default function Recordings() {
  const { user } = useAuth();
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
  const { formatDuration } = useFormatters();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(null);
  const projectIdsRef = useRef<string[] | null>(null);

  // Fetch project IDs once
  useEffect(() => {
    if (!user) return;

    const loadProjectIds = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id');

      projectIdsRef.current = (data || []).map(p => p.id);
      fetchRecordings(projectIdsRef.current);
    };

    loadProjectIds();
  }, [user]);

  // Fetch recordings when pagination or filter changes
  useEffect(() => {
    if (projectIdsRef.current) {
      fetchRecordings(projectIdsRef.current);
    }
  }, [currentPage, statusFilter]);

  const fetchRecordings = async (projectIds: string[]) => {
    if (projectIds.length === 0) {
      setRecordings([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from('recordings')
      .select('*', { count: 'exact' })
      .in('project_id', projectIds)
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
  };

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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('recordings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('recordings.subtitle')}</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
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
              {t('recordings.noRecordings')}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {statusFilter !== 'all'
                ? t('recordings.noRecordingsSearch')
                : t('recordings.noRecordingsYet')}
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
                  <TableHead className="hidden md:table-cell">{t('detail.table.transcription')}</TableHead>
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
                    <TableCell className="max-w-xs hidden md:table-cell">
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
                          onClick={() => setPlayingRecording(recording)}
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
            <div className="flex items-center justify-between mt-4">
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

      {/* Audio Player Modal */}
      <AudioPlayerModal
        recording={playingRecording}
        onClose={() => setPlayingRecording(null)}
      />
    </div>
  );
}
