import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, Project } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFormatters } from '@/hooks/useFormatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, FolderOpen, Mic } from 'lucide-react';

interface ProjectWithCount extends Project {
  recording_count: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { formatDate } = useFormatters();
  const [projects, setProjects] = useState<ProjectWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

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

    // Get recording counts for each project
    const projectsWithCounts: ProjectWithCount[] = await Promise.all(
      (projectsData || []).map(async (project) => {
        const { count } = await supabase
          .from('recordings')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);

        return {
          ...project,
          recording_count: count || 0,
        };
      })
    );

    setProjects(projectsWithCounts);
    setLoading(false);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModeLabel = (mode: string) => {
    return tCommon(`transcriptionModes.${mode}`);
  };

  return (
    <div className="p-8">
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

      {/* Search */}
      <div className="mb-6">
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

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? t('noResults') : t('createFirst')}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {searchQuery ? t('noResultsHint') : t('createFirstHint')}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link to="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newProject')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.mode')}</TableHead>
                <TableHead>{t('table.recordings')}</TableHead>
                <TableHead>{t('table.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-3 font-medium text-foreground hover:text-primary"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Mic className="h-4 w-4 text-primary" />
                      </div>
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={project.transcription_mode === 'realtime' ? 'default' : 'secondary'}
                    >
                      {getModeLabel(project.transcription_mode)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.recording_count}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(project.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
