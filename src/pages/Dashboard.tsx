import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Project } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFolders } from '@/contexts/FolderContext';
import { useFormatters } from '@/hooks/useFormatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, Mic, MoreHorizontal, Eye, Archive, Trash2, Mic2, Clock, FolderOpen, CreditCard, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { accountApi } from '@/lib/api';
import type { UsageData } from '@/lib/plans';

// --- Types ---

type ProjectStatus = 'active' | 'processing' | 'complete' | 'archived' | 'error' | 'pending';

interface ProjectWithStats extends Project {
  recording_count: number;
  transcribed_count: number;
  total_duration_seconds: number;
  derived_status: ProjectStatus;
}

// --- Status badge config (DESIGN_SYSTEM.md section 6.3) ---

const statusConfig: Record<ProjectStatus, { class: string }> = {
  active:     { class: 'bg-primary/10 text-primary border-transparent' },
  processing: { class: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-transparent' },
  complete:   { class: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-transparent' },
  archived:   { class: 'bg-muted text-muted-foreground border-transparent' },
  error:      { class: 'bg-destructive/10 text-destructive border-transparent' },
  pending:    { class: 'bg-muted text-muted-foreground border-transparent' },
};

// --- Helpers ---

function deriveProjectStatus(
  recordingCount: number,
  transcribedCount: number,
  failedCount: number,
  processingCount: number,
): ProjectStatus {
  if (recordingCount === 0) return 'active';
  if (failedCount > 0 && failedCount === recordingCount) return 'error';
  if (processingCount > 0) return 'processing';
  if (transcribedCount === recordingCount) return 'complete';
  if (transcribedCount > 0) return 'processing';
  return 'pending';
}

function formatHours(totalSeconds: number): string {
  const hours = totalSeconds / 3600;
  if (hours < 0.1) return '0h';
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function formatDurationCompact(totalSeconds: number): string {
  if (totalSeconds === 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// --- Draggable Table Row ---

function DraggableTableRow({ project, children }: { project: ProjectWithStats; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { type: 'project', project },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : undefined }
    : undefined;

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50 group">
      <TableCell className="w-8 px-2">
        <div
          {...listeners}
          {...attributes}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

// --- Component ---

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const { formatNumber } = useFormatters();
  const { selectedFolderId, refreshProjectCounts } = useFolders();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [deletingProject, setDeletingProject] = useState<ProjectWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchUsage();
    }
  }, [user]);

  const fetchUsage = async () => {
    const result = await accountApi.getUsage();
    if (result.success && result.data) {
      setUsage(result.data);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);

    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
      return;
    }

    if (projectsData.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    // Fetch all recordings for the user's projects in a single query
    const projectIds = projectsData.map(p => p.id);
    const { data: recordingsData } = await supabase
      .from('recordings')
      .select('project_id, status, duration_seconds')
      .in('project_id', projectIds);

    // Aggregate per project
    const statsMap: Record<string, {
      count: number;
      transcribed: number;
      failed: number;
      processing: number;
      totalDuration: number;
    }> = {};

    if (recordingsData) {
      for (const rec of recordingsData) {
        if (!statsMap[rec.project_id]) {
          statsMap[rec.project_id] = { count: 0, transcribed: 0, failed: 0, processing: 0, totalDuration: 0 };
        }
        const s = statsMap[rec.project_id];
        s.count++;
        s.totalDuration += rec.duration_seconds || 0;
        if (rec.status === 'completed') s.transcribed++;
        else if (rec.status === 'failed') s.failed++;
        else if (rec.status === 'processing') s.processing++;
      }
    }

    const projectsWithStats: ProjectWithStats[] = projectsData.map(project => {
      const stats = statsMap[project.id] || { count: 0, transcribed: 0, failed: 0, processing: 0, totalDuration: 0 };
      return {
        ...project,
        recording_count: stats.count,
        transcribed_count: stats.transcribed,
        total_duration_seconds: stats.totalDuration,
        derived_status: deriveProjectStatus(stats.count, stats.transcribed, stats.failed, stats.processing),
      };
    });

    setProjects(projectsWithStats);
    setLoading(false);
    refreshProjectCounts();
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', deletingProject.id);
    setIsDeleting(false);
    setDeletingProject(null);
    if (!error) {
      fetchProjects();
      refreshProjectCounts();
    }
  };

  // --- Computed values ---

  // For now, all projects are considered "active" (no archived field in DB).
  // When the backend adds an `archived_at` column, filter here.
  const activeProjects = projects.filter(() => true);
  const archivedProjects: ProjectWithStats[] = [];

  const displayedProjects = activeTab === 'active' ? activeProjects : archivedProjects;

  // Apply folder filter
  const folderFilteredProjects = displayedProjects.filter((project) => {
    if (selectedFolderId === null) return true; // "All"
    if (selectedFolderId === 'unorganized') return !project.folder_id;
    return project.folder_id === selectedFolderId;
  });

  const filteredProjects = folderFilteredProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stat card values
  const totalTranscribed = projects.reduce((sum, p) => sum + p.transcribed_count, 0);
  const totalDurationSeconds = projects.reduce((sum, p) => sum + p.total_duration_seconds, 0);
  const activeProjectCount = activeProjects.length;
  const creditsUsed = usage?.usage.responses_this_month ?? 0;

  // Progress: % of recordings transcribed
  const getTranscriptionProgress = (p: ProjectWithStats) => {
    if (p.recording_count === 0) return 0;
    return Math.round((p.transcribed_count / p.recording_count) * 100);
  };

  // --- Status badge (section 6.3 — whitespace-nowrap always) ---

  const renderStatusBadge = (status: ProjectStatus) => {
    const config = statusConfig[status];
    return (
      <Badge className={`whitespace-nowrap ${config.class}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
        {t(`projectStatus.${status}`)}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            {t('newProject')}
          </Link>
        </Button>
      </div>

      {/* F3.1 — Stat Cards (4 cards, section 6.1 structure) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Mic2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('stats.totalRecordings')}</p>
            </div>
            <p className="text-3xl font-bold mt-1">{loading ? '-' : formatNumber(totalTranscribed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('stats.hoursProcessed')}</p>
            </div>
            <p className="text-3xl font-bold mt-1">{loading ? '-' : formatHours(totalDurationSeconds)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('stats.activeProjects')}</p>
            </div>
            <p className="text-3xl font-bold mt-1">{loading ? '-' : formatNumber(activeProjectCount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('stats.creditsUsed')}</p>
            </div>
            <p className="text-3xl font-bold mt-1">
              {loading ? '-' : (
                usage ? `${formatNumber(creditsUsed)}${usage.limits.max_responses ? ` / ${formatNumber(usage.limits.max_responses)}` : ''}` : '-'
              )}
            </p>
            {usage && usage.limits.max_responses && (
              <div className="mt-2">
                <Progress value={Math.min((creditsUsed / usage.limits.max_responses) * 100, 100)} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* F3.4 — Tabs: Active / Archived */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'archived')}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="active">
              {t('tabs.active')} ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              {t('tabs.archived')} ({archivedProjects.length})
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Active tab content */}
        <TabsContent value="active">
          {renderProjectList(filteredProjects)}
        </TabsContent>

        {/* Archived tab content */}
        <TabsContent value="archived">
          {renderProjectList(filteredProjects)}
        </TabsContent>
      </Tabs>

      {/* AlertDialog for project deletion (DESIGN_SYSTEM.md section 8.4) */}
      <AlertDialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingProject ? t('deleteDialog.title', { name: deletingProject.name }) : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // --- Render helpers ---

  function renderProjectList(projectList: ProjectWithStats[]) {
    // Loading state — skeleton (section 8.5)
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    // F3.5 — Empty state (section 6.6)
    if (projectList.length === 0) {
      // If searching, show "no results" message
      if (searchQuery) {
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noResults')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {t('noResultsHint')}
              </p>
            </CardContent>
          </Card>
        );
      }

      // Empty state for "no projects yet" — references installing the voice capture widget
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Mic className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('createFirst')}</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {t('createFirstHint')}
          </p>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              {t('newProject')}
            </Link>
          </Button>
        </div>
      );
    }

    // F3.2 — Projects table: Drag | Project Name | Status | Recordings | Duration | Actions
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 px-2" />
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.recordings')}</TableHead>
              <TableHead>{t('table.duration')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectList.map((project) => {
              const progress = getTranscriptionProgress(project);
              return (
                <DraggableTableRow key={project.id} project={project}>
                  <TableCell>
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-3 font-medium text-foreground hover:text-primary"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Mic className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate">{project.name}</p>
                        {project.recording_count > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={progress} className="h-1.5 flex-1 max-w-[120px]" />
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {/* F3.3 — Status badges with whitespace-nowrap */}
                    {renderStatusBadge(project.derived_status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.recording_count}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDurationCompact(project.total_duration_seconds)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            {t('actions.view')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Archive className="h-4 w-4" />
                          {t('actions.archive')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeletingProject(project)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </DraggableTableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    );
  }
}
