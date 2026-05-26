import { pdfOutputName } from "@/src/lib/supported";

export type QueueStatus = "pending" | "converting" | "done" | "error";

export interface QueueItem {
  id: string;
  file: File;
  status: QueueStatus;
  error?: string;
}

export async function convertFileViaApi(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/convert", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Conversion failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.blob();
}

export function outputPdfName(filename: string): string {
  return pdfOutputName(filename);
}
