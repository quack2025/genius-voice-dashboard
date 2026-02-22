import { useDroppable } from "@dnd-kit/core";
import { Folder, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DroppableFolderItemProps {
  id: string;
  name: string;
  color?: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  icon?: "folder" | "all";
}

export function DroppableFolderItem({ id, name, color, count, isSelected, onClick, icon = "folder" }: DroppableFolderItemProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "folder", folderId: id === "all" || id === "unorganized" ? null : id },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all",
        isSelected
          ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))] font-medium"
          : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover-bg))]",
        isOver && "ring-2 ring-primary bg-[hsl(var(--sidebar-hover-bg))] scale-[1.02]"
      )}
    >
      {icon === "all" ? (
        <LayoutDashboard className="h-4 w-4" />
      ) : (
        <Folder className="h-4 w-4" style={{ color }} />
      )}
      <span className="flex-1 text-left truncate">{name}</span>
      <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-[hsl(var(--sidebar-hover-bg))] text-[hsl(var(--sidebar-foreground))]/70 border-0">
        {count}
      </Badge>
    </button>
  );
}
