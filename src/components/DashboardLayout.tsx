import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import AppSidebar from '@/components/AppSidebar';
import HelpChat from '@/components/HelpChat';
import { FolderProvider, useFolders } from '@/contexts/FolderContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

function DashboardLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { moveProjectToFolder, refreshProjectCounts } = useFolders();

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const projectData = active.data.current;
    const folderData = over.data.current;

    if (projectData?.type === 'project' && folderData?.type === 'folder') {
      const projectId = active.id as string;
      const folderId = folderData.folderId as string | null;
      await moveProjectToFolder(projectId, folderId);
    }
  }, [moveProjectToFolder]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex min-h-screen w-full">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 md:ml-64">
          {/* Mobile header */}
          <div className="md:hidden flex items-center gap-2 p-4 border-b border-border bg-background sticky top-0 z-30">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-foreground">Voice Capture</span>
          </div>
          <Outlet />
          <HelpChat />
        </main>
      </div>
    </DndContext>
  );
}

export default function DashboardLayout() {
  return (
    <FolderProvider>
      <DashboardLayoutInner />
    </FolderProvider>
  );
}
