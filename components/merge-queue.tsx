"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { QueueItem } from "@/lib/queue-types";
import { cn } from "@/lib/utils";

interface MergeQueueProps {
  items: QueueItem[];
  onRemove: (id: string) => void;
  onReorder: (items: QueueItem[]) => void;
  disabled?: boolean;
}

function SortableRow({
  item,
  onRemove,
  dragDisabled,
}: {
  item: QueueItem;
  onRemove: (id: string) => void;
  dragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusLabel = {
    pending: "Pending",
    converting: "Merging",
    done: "Done",
    error: "Error",
  } as const;

  const statusVariant = {
    pending: "secondary",
    converting: "outline",
    done: "default",
    error: "destructive",
  } as const;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2",
        isDragging && "bg-muted/80 opacity-90",
      )}
    >
      <button
        type="button"
        className={cn(
          "touch-none text-muted-foreground",
          dragDisabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-grab active:cursor-grabbing",
        )}
        aria-label={`Reorder ${item.file.name}`}
        disabled={dragDisabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.file.name}</p>
        {item.error && (
          <p className="mt-0.5 text-xs text-destructive">{item.error}</p>
        )}
      </div>
      <Badge variant={statusVariant[item.status]}>
        {item.status === "converting" && (
          <Loader2 className="mr-1 size-3 animate-spin" />
        )}
        {statusLabel[item.status]}
      </Badge>
      {item.status === "pending" && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.file.name}`}
        >
          <X className="size-4" />
        </Button>
      )}
    </li>
  );
}

export function MergeQueue({
  items,
  onRemove,
  onReorder,
  disabled,
}: MergeQueueProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const canDrag = !disabled && items.every((i) => i.status === "pending");

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No PDFs queued yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="h-[320px] rounded-lg border">
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="divide-y p-2">
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  onRemove={onRemove}
                  dragDisabled={!canDrag}
                />
              ))}
            </ul>
          </SortableContext>
        </ScrollArea>
      </DndContext>
      {canDrag && items.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag the handle to change merge order.
        </p>
      )}
    </div>
  );
}
