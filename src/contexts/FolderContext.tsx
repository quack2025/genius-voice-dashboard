import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { ProjectFolder } from '@/components/folders/FolderSection';

interface FolderContextValue {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  projectCounts: Record<string, number>;
  totalProjects: number;
  refreshProjectCounts: () => Promise<void>;
  moveProjectToFolder: (projectId: string, folderId: string | null) => Promise<void>;
}

const FolderContext = createContext<FolderContextValue | null>(null);

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [totalProjects, setTotalProjects] = useState(0);

  const refreshProjectCounts = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('id, folder_id')
      .eq('user_id', user.id);

    if (error || !data) return;

    const counts: Record<string, number> = {};
    for (const project of data) {
      if (project.folder_id) {
        counts[project.folder_id] = (counts[project.folder_id] || 0) + 1;
      }
    }

    setProjectCounts(counts);
    setTotalProjects(data.length);
  }, [user]);

  useEffect(() => {
    refreshProjectCounts();
  }, [refreshProjectCounts]);

  const moveProjectToFolder = useCallback(async (projectId: string, folderId: string | null) => {
    const { error } = await supabase
      .from('projects')
      .update({ folder_id: folderId })
      .eq('id', projectId);

    if (!error) {
      await refreshProjectCounts();
    }
  }, [refreshProjectCounts]);

  return (
    <FolderContext.Provider
      value={{
        selectedFolderId,
        setSelectedFolderId,
        projectCounts,
        totalProjects,
        refreshProjectCounts,
        moveProjectToFolder,
      }}
    >
      {children}
    </FolderContext.Provider>
  );
}

export function useFolders() {
  const ctx = useContext(FolderContext);
  if (!ctx) throw new Error('useFolders must be used within FolderProvider');
  return ctx;
}
