"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { DropZone } from "@/components/drop-zone";
import { MergeQueue } from "@/components/merge-queue";
import { OutputFolder } from "@/components/output-folder";
import { PdfPasswordDialog } from "@/components/pdf-password-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { fileNeedsPassword } from "@/lib/check-pdf-encrypted";
import {
  mergeFilesViaApi,
  resolveOutputFilename,
  type MergePasswordMap,
  type QueueItem,
} from "@/lib/merge-client";
import {
  downloadPdfBlob,
  savePdfToDirectory,
} from "@/lib/save-pdf";
import { useDirectoryPickerSupported } from "@/lib/use-directory-picker-supported";
import {
  DEFAULT_MERGED_FILENAME,
  isPdfFilename,
  MIN_MERGE_PDF_COUNT,
  PDF_ACCEPT_ATTRIBUTE,
} from "@/src/lib/supported";

function newId(): string {
  return crypto.randomUUID();
}

export function MergeApp() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [outputName, setOutputName] = useState(DEFAULT_MERGED_FILENAME);
  const [passwords, setPasswords] = useState<MergePasswordMap>({});
  const [passwordPrompt, setPasswordPrompt] = useState<{
    filename: string;
    resolve: (password: string) => void;
    reject: () => void;
  } | null>(null);
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const pendingItems = useMemo(
    () => items.filter((i) => i.status === "pending"),
    [items],
  );

  const fsaSupported = useDirectoryPickerSupported();
  const canMerge =
    pendingItems.length >= MIN_MERGE_PDF_COUNT &&
    !isMerging &&
    outputName.trim().length > 0 &&
    (!fsaSupported || directoryHandle !== null);

  const onFilesAdded = useCallback((files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: newId(),
        file,
        status: "pending" as const,
      })),
    ]);
  }, []);

  const onRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPasswords((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const onPickFolder = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker!();
      setDirectoryHandle(handle);
      setFolderName(handle.name);
    } catch {
      // user cancelled picker
    }
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<QueueItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const collectPasswords = useCallback(
    async (pending: QueueItem[], current: MergePasswordMap): Promise<MergePasswordMap | null> => {
      const next = { ...current };

      for (const item of pending) {
        if (next[item.id]) continue;

        const needsPassword = await fileNeedsPassword(item.file);
        if (!needsPassword) continue;

        const password = await new Promise<string | null>((resolve) => {
          setPasswordPrompt({
            filename: item.file.name,
            resolve: (value) => {
              setPasswordPrompt(null);
              resolve(value);
            },
            reject: () => {
              setPasswordPrompt(null);
              resolve(null);
            },
          });
        });

        if (!password) return null;
        next[item.id] = password;
      }

      return next;
    },
    [],
  );

  const onMerge = useCallback(async () => {
    if (pendingItems.length < MIN_MERGE_PDF_COUNT) return;

    setIsMerging(true);

    for (const item of pendingItems) {
      updateItem(item.id, { status: "converting", error: undefined });
    }

    const useDownloadFallback = !fsaSupported || !directoryHandle;
    const resolvedName = resolveOutputFilename(outputName);

    try {
      const mergedPasswords = await collectPasswords(pendingItems, passwords);
      if (!mergedPasswords) {
        for (const item of pendingItems) {
          updateItem(item.id, { status: "pending", error: undefined });
        }
        setIsMerging(false);
        return;
      }
      setPasswords(mergedPasswords);

      const blob = await mergeFilesViaApi({
        files: pendingItems.map((i) => i.file),
        fileIds: pendingItems.map((i) => i.id),
        outputName,
        passwords: mergedPasswords,
      });

      if (useDownloadFallback) {
        downloadPdfBlob(blob, resolvedName);
      } else {
        await savePdfToDirectory(directoryHandle!, resolvedName, blob);
      }

      for (const item of pendingItems) {
        updateItem(item.id, { status: "done" });
      }

      if (useDownloadFallback) {
        toast.success(`Downloaded ${resolvedName}`);
      } else {
        toast.success(`Saved ${resolvedName} to ${folderName}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Merge failed";
      for (const item of pendingItems) {
        updateItem(item.id, { status: "error", error: message });
      }
      toast.error(message);
    } finally {
      setIsMerging(false);
    }
  }, [
    collectPasswords,
    directoryHandle,
    folderName,
    fsaSupported,
    outputName,
    passwords,
    pendingItems,
    updateItem,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Merge PDFs</h1>
        <p className="text-muted-foreground">
          Combine multiple PDFs into one file. Drag to set page order.
        </p>
      </div>

      <DropZone
        onFilesAdded={onFilesAdded}
        disabled={isMerging}
        accept={PDF_ACCEPT_ATTRIBUTE}
        isValidFile={isPdfFilename}
        title="Drop PDFs here"
        description={`Select at least ${MIN_MERGE_PDF_COUNT} PDFs. Max 50MB per file.`}
      />

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Output filename</h2>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="merge-output-name">Filename</FieldLabel>
            <Input
              id="merge-output-name"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder={DEFAULT_MERGED_FILENAME}
              disabled={isMerging}
            />
            <FieldDescription>
              Saved as {resolveOutputFilename(outputName)} in the chosen folder.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Output location</h2>
        <OutputFolder
          folderName={folderName}
          onPickFolder={onPickFolder}
          disabled={isMerging}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Queue</h2>
          <Button type="button" disabled={!canMerge} onClick={onMerge}>
            {isMerging ? "Merging…" : "Merge PDFs"}
          </Button>
        </div>

        {isMerging && <Progress value={100} className="animate-pulse" />}

        <MergeQueue
          items={items}
          onRemove={onRemove}
          onReorder={setItems}
          disabled={isMerging}
        />
      </section>

      {passwordPrompt && (
        <PdfPasswordDialog
          open
          filename={passwordPrompt.filename}
          onCancel={passwordPrompt.reject}
          onSubmit={passwordPrompt.resolve}
        />
      )}
    </div>
  );
}
