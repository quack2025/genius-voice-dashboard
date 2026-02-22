import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DroppableFolderItem } from './DroppableFolderItem';
import { cn } from '@/lib/utils';

const FOLDER_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#64748b',
];

export interface ProjectFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FolderSectionProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  projectCounts: Record<string, number>;
  totalProjects: number;
}

export function FolderSection({
  selectedFolderId,
  onSelectFolder,
  projectCounts,
  totalProjects,
}: FolderSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state for create/rename
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'rename'>('create');
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deletingFolder, setDeletingFolder] = useState<ProjectFolder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('project_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setFolders(data as ProjectFolder[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Count of unorganized projects (no folder_id)
  const organizedCount = Object.entries(projectCounts)
    .filter(([key]) => key !== '__unorganized')
    .reduce((sum, [, count]) => sum + count, 0);
  const unorganizedCount = totalProjects - organizedCount;

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingFolder(null);
    setFolderName('');
    setFolderColor(FOLDER_COLORS[0]);
    setDialogOpen(true);
  };

  const openRenameDialog = (folder: ProjectFolder) => {
    setDialogMode('rename');
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!user || !folderName.trim()) return;
    setSaving(true);

    if (dialogMode === 'create') {
      const { error } = await supabase
        .from('project_folders')
        .insert({
          user_id: user.id,
          name: folderName.trim(),
          color: folderColor,
          sort_order: folders.length,
        });
      if (!error) {
        await fetchFolders();
      }
    } else if (editingFolder) {
      const { error } = await supabase
        .from('project_folders')
        .update({ name: folderName.trim(), color: folderColor, updated_at: new Date().toISOString() })
        .eq('id', editingFolder.id);
      if (!error) {
        await fetchFolders();
      }
    }

    setSaving(false);
    setDialogOpen(false);
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('project_folders')
      .delete()
      .eq('id', deletingFolder.id);

    if (!error) {
      // If the deleted folder was selected, reset to "All"
      if (selectedFolderId === deletingFolder.id) {
        onSelectFolder(null);
      }
      await fetchFolders();
    }

    setIsDeleting(false);
    setDeletingFolder(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--sidebar-foreground))]/60" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-1">
        <p className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))]/60 uppercase tracking-wider">
          {t('folders.title')}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[hsl(var(--sidebar-foreground))]/60 hover:text-[hsl(var(--sidebar-foreground))]"
          onClick={openCreateDialog}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* "All" item */}
      <DroppableFolderItem
        id="all"
        name={t('folders.all')}
        count={totalProjects}
        isSelected={selectedFolderId === null}
        onClick={() => onSelectFolder(null)}
        icon="all"
      />

      {/* User folders */}
      {folders.map((folder) => (
        <div key={folder.id} className="relative group/folder">
          <DroppableFolderItem
            id={folder.id}
            name={folder.name}
            color={folder.color}
            count={projectCounts[folder.id] || 0}
            isSelected={selectedFolderId === folder.id}
            onClick={() => onSelectFolder(folder.id)}
          />
          {/* Context menu trigger */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[hsl(var(--sidebar-foreground))]/60 hover:text-[hsl(var(--sidebar-foreground))]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => openRenameDialog(folder)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('folders.rename')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingFolder(folder)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('buttons.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {/* "No folder" item — only show if folders exist */}
      {folders.length > 0 && (
        <DroppableFolderItem
          id="unorganized"
          name={t('folders.unorganized')}
          count={unorganizedCount}
          isSelected={selectedFolderId === 'unorganized'}
          onClick={() => onSelectFolder('unorganized')}
          icon="folder"
          color="#64748b"
        />
      )}

      {/* Empty state */}
      {folders.length === 0 && (
        <button
          onClick={openCreateDialog}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-[hsl(var(--sidebar-foreground))]/50 hover:bg-[hsl(var(--sidebar-hover-bg))] transition-colors"
        >
          <FolderOpen className="h-4 w-4" />
          <span>{t('folders.create')}</span>
        </button>
      )}

      {/* Create/Rename Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? t('folders.create') : t('folders.rename')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder={t('folders.namePlaceholder')}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && folderName.trim()) {
                  handleSaveFolder();
                }
              }}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('folders.color')}
              </label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all',
                      folderColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFolderColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('buttons.cancel')}
            </Button>
            <Button onClick={handleSaveFolder} disabled={!folderName.trim() || saving}>
              {saving ? t('buttons.loading') : t('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingFolder ? t('folders.deleteTitle', { name: deletingFolder.name }) : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('folders.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('buttons.loading') : t('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
