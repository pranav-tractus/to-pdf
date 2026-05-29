import {
  DEFAULT_MERGED_FILENAME,
  normalizeMergedFilename,
} from "@/src/lib/supported";

export { type QueueItem, type QueueStatus } from "@/lib/queue-types";

export type MergePasswordMap = Record<string, string>;

export function resolveOutputFilename(name: string): string {
  return normalizeMergedFilename(name || DEFAULT_MERGED_FILENAME);
}

export interface MergeViaApiOptions {
  files: File[];
  fileIds: string[];
  outputName: string;
  passwords: MergePasswordMap;
}

export type MergeApiErrorBody = {
  error?: string;
  code?: "PASSWORD_REQUIRED" | "MERGE";
};

export async function mergeFilesViaApi(
  options: MergeViaApiOptions,
): Promise<Blob> {
  const formData = new FormData();
  for (let i = 0; i < options.files.length; i += 1) {
    formData.append("files", options.files[i]);
    formData.append("fileIds", options.fileIds[i]);
  }
  formData.append("outputName", resolveOutputFilename(options.outputName));
  formData.append("passwords", JSON.stringify(options.passwords));

  const response = await fetch("/api/merge", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Merge failed (${response.status})`;
    let code: MergeApiErrorBody["code"];
    try {
      const body = (await response.json()) as MergeApiErrorBody;
      if (body.error) message = body.error;
      code = body.code;
    } catch {
      // ignore JSON parse errors
    }
    const err = new Error(message) as Error & { code?: typeof code };
    err.code = code;
    throw err;
  }

  return response.blob();
}
