export type QueueStatus = "pending" | "converting" | "done" | "error";

export interface QueueItem {
  id: string;
  file: File;
  status: QueueStatus;
  error?: string;
}
