import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableProjectCardProps {
  project: { id: string; [key: string]: any };
  children: React.ReactNode;
}

export function DraggableProjectCard({ project, children }: DraggableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { type: "project", project },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined } : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn("relative group", isDragging && "opacity-50")}>
      <div
        {...listeners}
        {...attributes}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing",
          isDragging && "opacity-100"
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}
