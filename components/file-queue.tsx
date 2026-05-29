"use client";

import { FileText, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { QueueItem } from "@/lib/queue-types";

interface FileQueueProps {
  items: QueueItem[];
  onRemove: (id: string) => void;
}

const statusLabel: Record<QueueItem["status"], string> = {
  pending: "Pending",
  converting: "Converting",
  done: "Done",
  error: "Error",
};

const statusVariant: Record<
  QueueItem["status"],
  "secondary" | "default" | "destructive" | "outline"
> = {
  pending: "secondary",
  converting: "outline",
  done: "default",
  error: "destructive",
};

export function FileQueue({ items, onRemove }: FileQueueProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No files queued yet.</p>
    );
  }

  return (
    <ScrollArea className="h-[280px] rounded-lg border">
      <ul className="divide-y p-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-md px-2 py-2"
          >
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
        ))}
      </ul>
    </ScrollArea>
  );
}
